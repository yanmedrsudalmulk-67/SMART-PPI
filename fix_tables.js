const fs = require('fs');
const glob = require('glob');

const fixTable = (file, wrapperRegex, wrapperReplace, tableRegex, tableReplace) => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  if (content.match(wrapperRegex)) {
    content = content.replace(wrapperRegex, wrapperReplace);
    changed = true;
  }
  if (content.match(tableRegex)) {
    content = content.replace(tableRegex, tableReplace);
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
};

// OfficialReportSheet
fixTable(
  'components/reports/OfficialReportSheet.tsx',
  /className="mb-10 rounded-xl overflow-hidden/g,
  'className="mb-10 rounded-xl overflow-x-auto print:overflow-visible',
  /<table className="w-full border-collapse text-left text-sm/g,
  '<table className="w-full min-w-[700px] border-collapse text-left text-sm'
);

// DekontaminasiAlatReport
fixTable(
  'components/reports/DekontaminasiAlatReport.tsx',
  /<div className="mb-10">\n\s*<table/g,
  '<div className="mb-10 overflow-x-auto print:overflow-visible">\n          <table',
  /<table className="w-full border-collapse/g,
  '<table className="w-full min-w-[700px] border-collapse'
);

// HandHygieneReport
fixTable(
  'components/reports/HandHygieneReport.tsx',
  /<table className="w-full text-center border-collapse/g,
  '<table className="w-full min-w-[600px] text-center border-collapse'
);

// ApdReport
fixTable(
  'components/reports/ApdReport.tsx',
  /<table className="w-full text-center border-collapse/g,
  '<table className="w-full min-w-[600px] text-center border-collapse'
);

// AirborneReport
fixTable(
  'components/reports/AirborneReport.tsx',
  /<table className="w-full text-left border-collapse/g,
  '<table className="w-full min-w-[800px] text-left border-collapse'
);

// Main reports page (Data Raw table)
fixTable(
  'app/dashboard/reports/page.tsx',
  /<table className="w-full text-left border-collapse/g,
  '<table className="w-full min-w-[800px] text-left border-collapse'
);
