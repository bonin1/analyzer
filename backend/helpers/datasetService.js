const axios = require('axios');
const Seven = require('node-7z');
const sevenBin = require('7zip-bin');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { Company, Personnel, ExpenseCategory } = require('../models');
const Form990Parser = require('../helpers/xmlParser');
const { ensureDirectoryExists, deleteDirectory, generateTempFilename } = require('../helpers/dataHelper');
const logger = require('../config/logger');

class DatasetService {
  constructor() {
    this.parser = new Form990Parser();
    this.tempDir = path.join(__dirname, '../temp');
  }

  /**
   * Download, extract, and process IRS dataset
   * @param {string} irsZipUrl - URL to IRS ZIP file
   * @param {number} maxCompanies - Maximum number of companies to import (optional)
   * @returns {Object} Processing results with statistics
   */
  async processDataset(irsZipUrl, maxCompanies = null) {
    const stats = {
      totalFiles: 0,
      processed: 0,
      saved: 0,
      errors: 0,
      startTime: Date.now(),
      errors: []
    };

    let tempPath = null;

    try {
      logger.info('Starting dataset import', { url: irsZipUrl, maxCompanies: maxCompanies || 'unlimited' });

      // Step 1: Download ZIP file
      tempPath = await this.downloadZipFile(irsZipUrl);
      logger.info('ZIP file downloaded', { path: tempPath });

      // Step 2: Extract ZIP file
      const extractPath = await this.extractZipFile(tempPath);
      logger.info('ZIP file extracted', { path: extractPath });

      // Step 3: Process XML files
      const xmlFiles = await this.getXmlFiles(extractPath);
      stats.totalFiles = xmlFiles.length;
      logger.info(`Found ${xmlFiles.length} XML files to process`);

      // Limit files if maxCompanies is specified
      const filesToProcess = maxCompanies ? xmlFiles.slice(0, maxCompanies) : xmlFiles;
      logger.info(`Processing ${filesToProcess.length} files (limit: ${maxCompanies || 'none'})`);

      // Step 4: Parse and save each file
      for (const xmlFile of filesToProcess) {
        try {
          await this.processXmlFile(xmlFile, stats);
          
          // Stop if we've reached the limit
          if (maxCompanies && stats.saved >= maxCompanies) {
            logger.info(`Reached max companies limit: ${maxCompanies}`);
            break;
          }
        } catch (error) {
          stats.errors++;
          const errorMessage = `Error processing file ${path.basename(xmlFile)}: ${error.message}`;
          stats.errors.push(errorMessage);
          logger.error(errorMessage, { file: xmlFile, error: error.stack });
        }
      }

      // Step 5: Cleanup
      await deleteDirectory(extractPath);
      if (tempPath) {
        await fsPromises.unlink(tempPath).catch(() => {});
      }

      stats.duration = Date.now() - stats.startTime;
      logger.info('Dataset import completed', stats);

      return stats;
    } catch (error) {
      logger.error('Dataset import failed', { error: error.message, stack: error.stack });
      
      // Cleanup on failure
      if (tempPath) {
        await fsPromises.unlink(tempPath).catch(() => {});
      }
      
      throw error;
    }
  }

  /**
   * Download ZIP file from URL
   */
  async downloadZipFile(url) {
    await ensureDirectoryExists(this.tempDir);
    
    const filename = generateTempFilename('irs') + '.zip';
    const filepath = path.join(this.tempDir, filename);

    logger.info('Downloading ZIP file', { url, filepath });

    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      timeout: 300000, // 5 minutes
      maxContentLength: 500 * 1024 * 1024 // 500MB max
    });

    await fsPromises.writeFile(filepath, response.data);
    
    return filepath;
  }

  /**
   * Extract ZIP file contents
   */
  async extractZipFile(zipPath) {
    const extractPath = zipPath.replace('.zip', '_extracted');
    await ensureDirectoryExists(extractPath);

    logger.info('Extracting ZIP file', { zipPath, extractPath });
return new Promise((resolve, reject) => {
      const stream = Seven.extractFull(zipPath, extractPath, {
        $bin: sevenBin.path7za,
        $progress: true
      });

      stream.on('end', () => resolve(extractPath));
      
      stream.on('error', (err) => {
        logger.error('7zip extraction failed', { error: err.message });
        reject(err);
      });
    })
    return extractPath;
  }

  /**
   * Get all XML files from directory
   */
  async getXmlFiles(dirPath) {
    const files = [];
    
    async function readDir(currentPath) {
      const entries = await fsPromises.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          await readDir(fullPath);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.xml')) {
          files.push(fullPath);
        }
      }
    }

    await readDir(dirPath);
    return files;
  }

  /**
   * Process single XML file
   */
  async processXmlFile(xmlFilePath, stats) {
    stats.processed++;

    // Read XML content
    const xmlContent = await fsPromises.readFile(xmlFilePath, 'utf8');

    // Parse XML
    const parsedData = this.parser.parse(xmlContent);
    
    if (!parsedData) {
      logger.warn('Failed to parse XML file', { file: path.basename(xmlFilePath) });
      return;
    }

    // Save to database
    await this.saveToDatabase(parsedData);
    stats.saved++;

    if (stats.saved % 100 === 0) {
      logger.info(`Progress: ${stats.saved}/${stats.totalFiles} companies saved`);
    }
  }

  /**
   * Save parsed data to database
   */
  async saveToDatabase(data) {
    const { company: companyData, personnel, expenses } = data;

    if (!companyData.ein) {
      throw new Error('Company EIN is required');
    }

    // Create or update company
    const [company] = await Company.upsert({
      ...companyData,
      taxYear: companyData.taxYear || new Date().getFullYear()
    }, {
      conflictFields: ['ein']
    });

    const companyId = company.id;

    // Delete existing personnel and expenses for this company
    await Personnel.destroy({ where: { companyId } });
    await ExpenseCategory.destroy({ where: { companyId } });

    // Add personnel
    if (personnel && personnel.length > 0) {
      const personnelData = personnel.map(p => ({
        ...p,
        companyId,
        taxYear: companyData.taxYear
      }));
      await Personnel.bulkCreate(personnelData, { ignoreDuplicates: true });
    }

    // Add expenses
    if (expenses && expenses.length > 0) {
      const expenseData = expenses.map(e => ({
        ...e,
        companyId,
        taxYear: companyData.taxYear
      }));
      await ExpenseCategory.bulkCreate(expenseData, { ignoreDuplicates: true });
    }
  }
}

module.exports = DatasetService;
