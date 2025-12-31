const { XMLParser } = require('fast-xml-parser');
const { getNestedValue, extractText, extractNumber } = require('./dataHelper');
const logger = require('../config/logger');

class Form990Parser {
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      trimValues: true,
      removeNSPrefix: true,  // Remove namespace prefixes
      ignoreNameSpace: true  // Ignore namespaces completely
    });
  }

  /**
   * Parse Form 990 XML file
   * @param {string} xmlContent - Raw XML content
   * @returns {Object|null} Parsed company data or null if parsing fails
   */
  parse(xmlContent) {
    try {
      const parsed = this.parser.parse(xmlContent);
      
      // Extract the main Form 990 data
      let returnData = getNestedValue(parsed, 'Return.ReturnData');
      
      // If no ReturnData, check if data is directly under Return (newer format)
      if (!returnData) {
        returnData = parsed.Return;
      }
      
      if (!returnData) {
        logger.warn('No Return data found in XML');
        return null;
      }

      // Try to find IRS990 form (there are different variations)
      // Including 990, 990-EZ, 990-PF, and 990-T
      const irs990 = returnData.IRS990 || 
                     returnData.IRS990EZ || 
                     returnData.IRS990PF ||
                     returnData.IRS990T;
      
      if (!irs990) {
        logger.warn('No IRS990 form found in XML');
        return null;
      }

      // Extract basic company information
      const companyData = this.extractCompanyInfo(parsed, irs990);
      
      // Skip if no EIN (required field)
      if (!companyData.ein) {
        logger.warn('No EIN found in XML, skipping');
        return null;
      }
      
      // Extract financial data
      const financialData = this.extractFinancialData(irs990);
      
      // Extract personnel information
      const personnel = this.extractPersonnel(irs990);
      
      // Extract expense categories
      const expenses = this.extractExpenses(irs990);

      return {
        company: { ...companyData, ...financialData },
        personnel,
        expenses
      };
    } catch (error) {
      logger.error('Error parsing XML:', error);
      return null;
    }
  }

  /**
   * Extract basic company information
   */
  extractCompanyInfo(parsed, irs990) {
    const returnHeader = getNestedValue(parsed, 'Return.ReturnHeader', {});
    const filer = returnHeader.Filer || {};
    
    // Determine form type
    let formType = '990';
    if (parsed.Return?.ReturnData?.IRS990EZ) formType = '990EZ';
    else if (parsed.Return?.ReturnData?.IRS990PF) formType = '990PF';
    else if (parsed.Return?.ReturnData?.IRS990T) formType = '990T';
    
    return {
      ein: extractText(filer.EIN) || null,
      name: extractText(filer.BusinessName?.BusinessNameLine1Txt) || 
            extractText(filer.Name?.BusinessNameLine1) || 
            'Unknown Organization',
      formType: formType,
      taxYear: extractNumber(returnHeader.TaxYr) || 
               extractNumber(returnHeader.TaxYear) || 
               new Date().getFullYear(),
      taxPeriodBegin: extractText(returnHeader.TaxPeriodBeginDt) || 
                      extractText(returnHeader.TaxPeriodBeginDate) || 
                      null,
      taxPeriodEnd: extractText(returnHeader.TaxPeriodEndDt) || 
                    extractText(returnHeader.TaxPeriodEndDate) || 
                    null,
      filingDate: extractText(returnHeader.ReturnTs) || 
                  extractText(returnHeader.ReturnTimestamp) || 
                  null,
      website: extractText(irs990.WebsiteAddressTxt) || 
               extractText(irs990.WebSite) || 
               null,
      mission: extractText(irs990.ActivityOrMissionDesc) || 
               extractText(irs990.MissionDesc) || 
               null
    };
  }

  /**
   * Extract financial data (current and previous year)
   */
  extractFinancialData(irs990) {
    // Current year data - check multiple possible field names
    // Form 990: CYTotalRevenueAmt, Form 990-EZ: TotalRevenueAmt
    const currentRevenue = extractNumber(
      irs990.CYTotalRevenueAmt || 
      irs990.TotalRevenueAmt ||  // 990-EZ
      irs990.TotalRevenueGrp?.TotalRevenueColumnAmt ||
      irs990.RevenueAmt ||  // Some variations
      irs990.TotalRevenue
    );

    // Form 990: CYTotalExpensesAmt, Form 990-EZ: TotalExpensesAmt
    const currentExpenses = extractNumber(
      irs990.CYTotalExpensesAmt || 
      irs990.TotalExpensesAmt ||  // 990-EZ
      irs990.TotalExpensesGrp?.TotalExpensesColumnAmt ||
      irs990.ExpensesAmt ||  // Some variations
      irs990.TotalExpenses
    );

    const currentAssets = extractNumber(
      irs990.TotalAssetsEOYAmt || 
      irs990.TotalAssetsGrp?.EOYAmt ||
      irs990.Form990TotalAssetsGrp?.EOYAmt ||
      irs990.TotalAssets
    );

    const currentEmployees = extractNumber(
      irs990.TotalEmployeeCnt || 
      irs990.TotalNbrEmployees ||
      irs990.NumberOfEmployees
    );

    // Previous year data
    const previousRevenue = extractNumber(
      irs990.PYTotalRevenueAmt || 
      irs990.TotalRevenueGrp?.PriorYearAmt ||
      0
    );

    const previousExpenses = extractNumber(
      irs990.PYTotalExpensesAmt || 
      irs990.TotalExpensesGrp?.PriorYearAmt ||
      0
    );

    const previousAssets = extractNumber(
      irs990.TotalAssetsBOYAmt || 
      irs990.TotalAssetsGrp?.BOYAmt ||
      irs990.Form990TotalAssetsGrp?.BOYAmt ||
      0
    );

    const previousEmployees = extractNumber(
      irs990.PYTotalEmployeeCnt || 
      0
    );

    return {
      currentRevenue,
      currentExpenses,
      currentAssets,
      currentEmployeeCount: currentEmployees,
      previousRevenue,
      previousExpenses,
      previousAssets,
      previousEmployeeCount: previousEmployees
    };
  }

  /**
   * Extract key personnel information
   */
  extractPersonnel(irs990) {
    const personnel = [];
    
    // Officers, directors, trustees, key employees
    const officersList = irs990.Form990PartVIISectionAGrp || 
                        irs990.OfficerDirectorTrusteeEmplGrp ||
                        irs990.Officers ||
                        [];
    
    const officers = Array.isArray(officersList) ? officersList : [officersList];

    officers.forEach(officer => {
      if (!officer) return;
      
      const personName = officer.PersonNm || officer.Name || officer.PersonName;
      const fullName = extractText(personName) || 
                      `${extractText(personName?.FirstName)} ${extractText(personName?.LastName)}`.trim();
      
      const title = extractText(officer.TitleTxt) || 
                   extractText(officer.Title) || 
                   'Unknown';
      
      // Calculate total compensation including all components
      const reportableComp = extractNumber(
        officer.ReportableCompFromOrgAmt ||
        officer.TotalCompensationFilingOrgAmt ||
        officer.Compensation ||
        0
      );
      
      const otherComp = extractNumber(
        officer.OtherCompensationAmt ||
        0
      );
      
      const relatedComp = extractNumber(
        officer.ReportableCompFromRltdOrgAmt ||
        0
      );
      
      const compensation = reportableComp + otherComp + relatedComp;

      if (fullName && fullName !== 'Unknown') {
        personnel.push({
          fullName,
          title,
          compensation
        });
      }
    });

    return personnel;
  }

  /**
   * Extract expense categories
   */
  extractExpenses(irs990) {
    const expenses = [];
    
    // Common expense categories from Form 990 Part IX
    const expenseCategories = {
      'Grants and similar amounts paid': 
        irs990.GrantsToDomesticOrgsAmt || 
        irs990.GrantsToDomesticOrgsGrp?.TotalAmt ||
        irs990.GrantsAndSimilarAmountsPaid || 0,
      'Compensation of officers': 
        irs990.CompCurrentOfcrDirectorsAmt || 
        irs990.CompCurrentOfcrDirectorsGrp?.TotalAmt ||
        irs990.CompensationOfOfficers || 0,
      'Other salaries and wages': 
        irs990.CompDisqualPersonsAmt || 
        irs990.OtherSalariesAndWagesGrp?.TotalAmt ||
        irs990.OtherSalariesAndWages || 0,
      'Pension and benefits': 
        irs990.EmployeeBenefitsAmt || 
        irs990.PensionPlanContributionsGrp?.TotalAmt ||
        irs990.PensionPlanContributions || 0,
      'Legal fees': 
        irs990.LegalFeesAmt || 
        irs990.FeesForServicesLegalGrp?.TotalAmt ||
        irs990.LegalFees || 0,
      'Accounting fees': 
        irs990.AccountingFeesAmt || 
        irs990.FeesForServicesAccountingGrp?.TotalAmt ||
        irs990.AccountingFees || 0,
      'Professional fundraising fees': 
        irs990.ProfessionalFundraisingAmt || 
        irs990.FundraisingFeesGrp?.TotalAmt ||
        irs990.FundraisingFees || 0,
      'Other professional fees': 
        irs990.OtherProfessionalFeesAmt || 
        irs990.FeesForServicesOtherGrp?.TotalAmt ||
        irs990.OtherProfessionalFees || 0,
      'Occupancy': 
        irs990.OccupancyAmt || 
        irs990.OccupancyGrp?.TotalAmt ||
        irs990.Occupancy || 0,
      'Travel': 
        irs990.TravelAmt || 
        irs990.TravelGrp?.TotalAmt ||
        irs990.Travel || 0,
      'Office expenses': 
        irs990.OfficeExpensesAmt || 
        irs990.OfficeExpensesGrp?.TotalAmt ||
        irs990.OfficeExpenses || 0,
      'Depreciation': 
        irs990.DepreciationDepletionAmt || 
        irs990.DepreciationGrp?.TotalAmt ||
        irs990.Depreciation || 0
    };

    Object.entries(expenseCategories).forEach(([category, amount]) => {
      const expenseAmount = extractNumber(amount);
      if (expenseAmount > 0) {
        expenses.push({
          category,
          amount: expenseAmount
        });
      }
    });

    return expenses;
  }
}

module.exports = Form990Parser;
