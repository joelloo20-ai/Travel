import fs from 'node:fs/promises';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const outputDir = new URL('.', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1');
const outputPath = `${outputDir}/travel-atlas-template.xlsx`;

const palette = {
  ink: '#102528',
  forest: '#174346',
  teal: '#2D6565',
  sand: '#EFC182',
  paper: '#F7F2E8',
  mist: '#E7EEEA',
  line: '#CBD7D1',
  soft: '#FFF9EF',
  muted: '#65777A',
};

const titleFormat = {
  fill: palette.ink,
  font: { bold: true, color: '#FFFFFF', size: 20, name: 'Georgia' },
  horizontalAlignment: 'left',
  verticalAlignment: 'center',
};

const sectionFormat = {
  fill: palette.forest,
  font: { bold: true, color: '#FFFFFF', size: 10 },
  verticalAlignment: 'center',
};

const labelFormat = {
  fill: palette.mist,
  font: { bold: true, color: palette.ink, size: 9 },
  verticalAlignment: 'center',
};

function formatTopBand(sheet, range, title, subtitle) {
  sheet.getRange(range).merge();
  sheet.getRange(range).values = [[title]];
  sheet.getRange(range).format = titleFormat;
  const [, endCell] = range.split(':');
  const endColumn = endCell.replace(/\d+$/, '');
  const subtitleRange = `A2:${endColumn}2`;
  sheet.getRange(subtitleRange).merge();
  sheet.getRange(subtitleRange).values = [[subtitle]];
  sheet.getRange(subtitleRange).format = {
    fill: palette.ink,
    font: { color: '#D7E5DF', italic: true, size: 10 },
    verticalAlignment: 'center',
  };
}

function createReadMe(workbook) {
  const sheet = workbook.worksheets.add('Read Me');
  sheet.showGridLines = false;
  formatTopBand(
    sheet,
    'A1:H1',
    'Travel Atlas · trip workbook',
    'A calm, practical system for keeping every journey, reservation, and route in one place.',
  );
  sheet.getRange('A1:H2').format.rowHeight = 28;

  sheet.getRange('A4:H4').merge();
  sheet.getRange('A4:H4').values = [['HOW TO USE THIS WORKBOOK']];
  sheet.getRange('A4:H4').format = sectionFormat;
  sheet.getRange('A4:H4').format.rowHeight = 22;

  const steps = [
    ['1', 'Duplicate “Trip Template”', 'Create one new tab for every trip. Rename it with the city and travel dates.'],
    ['2', 'Fill the summary cards', 'Add dates, travellers, and the notes that shape the overall trip.'],
    ['3', 'Build the route below', 'Capture every activity with its time, distance from the previous stop, price, links, and document reference.'],
    ['4', 'Keep links alive', 'Paste booking, map, or ticket links into the itinerary. Use the document reference column to note the file name.'],
  ];
  sheet.getRange('A5:H8').values = steps.map(([number, heading, description]) => [number, heading, description, '', '', '', '', '']);
  sheet.getRange('A5:A8').format = { fill: palette.sand, font: { bold: true, color: palette.ink, size: 11 }, horizontalAlignment: 'center' };
  sheet.getRange('B5:B8').format = { font: { bold: true, color: palette.ink }, verticalAlignment: 'top' };
  sheet.getRange('C5:H8').merge(true);
  sheet.getRange('C5:H8').format = { font: { color: palette.muted, size: 10 }, wrapText: true, verticalAlignment: 'top' };
  sheet.getRange('A5:H8').format.borders = { preset: 'insideHorizontal', style: 'thin', color: palette.line };
  sheet.getRange('A5:H8').format.rowHeight = 38;

  sheet.getRange('A10:H10').merge();
  sheet.getRange('A10:H10').values = [['WHAT EACH TRIP TAB CAPTURES']];
  sheet.getRange('A10:H10').format = sectionFormat;
  sheet.getRange('A10:H10').format.rowHeight = 22;

  const fields = [
    ['Timing', 'Date, start time, and end time for every stop.'],
    ['Place', 'Destination, place of interest, activity type, and notes.'],
    ['Logistics', 'Distance from the previous activity plus transport mode.'],
    ['Money', 'Price and currency, with the trip total calculated at the top.'],
    ['References', 'Booking or map links and a document / ticket file reference.'],
  ];
  sheet.getRange('A11:B15').values = fields;
  sheet.getRange('A11:A15').format = { fill: palette.mist, font: { bold: true, color: palette.ink } };
  sheet.getRange('B11:B15').format = { font: { color: palette.muted }, wrapText: true };
  sheet.getRange('A11:B15').format.borders = { preset: 'insideHorizontal', style: 'thin', color: palette.line };
  sheet.getRange('A11:B15').format.rowHeight = 25;

  sheet.getRange('A17:H17').merge();
  sheet.getRange('A17:H17').values = [['GOOGLE SHEETS TIP']];
  sheet.getRange('A17:H17').format = { fill: '#F6E6C9', font: { bold: true, color: palette.ink, size: 10 } };
  sheet.getRange('A18:H19').merge();
  sheet.getRange('A18:H19').values = [['Upload this .xlsx file to Google Drive, then choose “Open with Google Sheets”. The formulas and each trip tab stay editable.']];
  sheet.getRange('A18:H19').format = { fill: palette.soft, font: { color: palette.muted, size: 10 }, wrapText: true, verticalAlignment: 'center' };
  sheet.getRange('A17:H19').format.borders = { preset: 'outside', style: 'thin', color: '#E6C891' };

  sheet.getRange('A:A').format.columnWidth = 14;
  sheet.getRange('B:B').format.columnWidth = 26;
  sheet.getRange('C:H').format.columnWidth = 16;
  sheet.freezePanes.freezeRows(2);
}

function createTripTemplate(workbook) {
  const sheet = workbook.worksheets.add('Trip Template');
  sheet.showGridLines = false;
  formatTopBand(
    sheet,
    'A1:N1',
    'Trip template · make it yours',
    'Duplicate this tab once per trip. Replace the example route below, or keep it as a planning guide.',
  );
  sheet.getRange('A1:N2').format.rowHeight = 28;

  sheet.getRange('A4:K5').values = [
    ['Trip name', 'Name your journey', '', 'Start date', new Date(2026, 8, 17), '', 'End date', new Date(2026, 8, 20), '', 'Travellers', '2'],
    ['Total spend', '', '', 'Route distance', '', '', 'Activities', '', '', 'Documents', ''],
  ];
  sheet.getRange('A4:K4').format = labelFormat;
  sheet.getRange('A5:K5').format = labelFormat;
  sheet.getRange('A4:K5').format.borders = { preset: 'all', style: 'thin', color: palette.line };
  sheet.getRange('B4:C4').merge();
  sheet.getRange('E4:F4').merge();
  sheet.getRange('H4:I4').merge();
  sheet.getRange('B5:C5').merge();
  sheet.getRange('E5:F5').merge();
  sheet.getRange('H5:I5').merge();
  sheet.getRange('K4:K5').format = { fill: palette.soft, font: { bold: true, color: palette.ink } };
  sheet.getRange('B4:C4').format = { fill: palette.soft, font: { color: palette.ink, italic: true } };
  sheet.getRange('E4:F4').format = { fill: palette.soft, font: { color: palette.ink } };
  sheet.getRange('H4:I4').format = { fill: palette.soft, font: { color: palette.ink } };
  sheet.getRange('B5:C5').formulas = [['=SUM(G9:G208)']];
  sheet.getRange('E5:F5').formulas = [['=SUM(I9:I208)']];
  sheet.getRange('H5:I5').formulas = [['=COUNTA(E9:E208)']];
  sheet.getRange('K5').formulas = [['=COUNTA(M9:M208)']];
  sheet.getRange('B5:C5').format = { fill: '#F6E6C9', font: { bold: true, color: palette.ink }, numberFormat: '#,##0.00' };
  sheet.getRange('E5:F5').format = { fill: '#F6E6C9', font: { bold: true, color: palette.ink }, numberFormat: '#,##0.0' };
  sheet.getRange('H5:I5').format = { fill: '#F6E6C9', font: { bold: true, color: palette.ink }, numberFormat: '#,##0' };
  sheet.getRange('K5').format = { fill: '#F6E6C9', font: { bold: true, color: palette.ink }, numberFormat: '#,##0' };
  sheet.getRange('E4:F4').format.numberFormat = 'yyyy-mm-dd';
  sheet.getRange('H4:I4').format.numberFormat = 'yyyy-mm-dd';
  sheet.getRange('A4:K5').format.rowHeight = 25;

  sheet.getRange('A7:N7').merge();
  sheet.getRange('A7:N7').values = [['ITINERARY · ADD, DELETE, OR REORDER STOPS AS YOUR PLAN TAKES SHAPE']];
  sheet.getRange('A7:N7').format = sectionFormat;
  sheet.getRange('A7:N7').format.rowHeight = 22;

  const headers = ['Date', 'Start', 'End', 'Destination', 'Place of interest', 'Category', 'Price', 'Currency', 'Distance from previous activity (km)', 'Transit', 'Booking / map link', 'Activity notes', 'Document reference', 'Status'];
  const examples = [
    [new Date(2026, 8, 17), '09:00', '09:45', '<City>', 'Arrival transfer', 'Transport', 28, 'SGD', 18.2, 'Taxi', 'https://', 'Add flight or transfer details', 'arrival-ticket.pdf', 'Booked'],
    [new Date(2026, 8, 17), '11:00', '13:00', '<City>', 'Signature landmark', 'Sightseeing', 24, 'SGD', 3.6, 'Metro', 'https://', 'Save opening hours or ticket notes', 'museum-reservation.pdf', 'To book'],
    [new Date(2026, 8, 17), '19:30', '21:00', '<City>', 'Dinner reservation', 'Food & drink', 110, 'SGD', 2.1, 'Walk', 'https://', 'Add dietary or confirmation details', 'dinner-confirmation.pdf', 'Booked'],
    [new Date(2026, 8, 18), '', '', '<City>', 'A flexible morning', 'Other', '', 'SGD', '', '', 'https://', 'Leave room for discovery.', '', 'Ideas'],
  ];
  sheet.getRange('A8:N8').values = [headers];
  sheet.getRange('A8:N8').format = { fill: palette.teal, font: { bold: true, color: '#FFFFFF', size: 9 }, wrapText: true, verticalAlignment: 'center' };
  sheet.getRange('A8:N8').format.rowHeight = 34;
  sheet.getRange('A9:N12').values = examples;
  sheet.getRange('A9:N12').format = { font: { color: palette.ink, size: 9 }, verticalAlignment: 'top' };
  sheet.getRange('A9:N12').format.borders = { preset: 'insideHorizontal', style: 'thin', color: palette.line };
  sheet.getRange('A9:N12').format.rowHeight = 32;
  sheet.getRange('A9:A208').format.numberFormat = 'yyyy-mm-dd';
  sheet.getRange('G9:G208').format.numberFormat = '#,##0.00';
  sheet.getRange('I9:I208').format.numberFormat = '#,##0.0';
  sheet.getRange('K9:M208').format.wrapText = true;
  sheet.getRange('F9:F208').dataValidation = { rule: { type: 'list', values: ['Sightseeing', 'Food & drink', 'Stay', 'Transport', 'Wellness', 'Shopping', 'Other'] } };
  sheet.getRange('N9:N208').dataValidation = { rule: { type: 'list', values: ['Ideas', 'To book', 'Booked', 'Done'] } };
  sheet.getRange('N9:N208').conditionalFormats.add('containsText', { text: 'Booked', format: { fill: '#DDEFE6', font: { color: '#215E42', bold: true } } });
  sheet.getRange('N9:N208').conditionalFormats.add('containsText', { text: 'To book', format: { fill: '#F9E4BD', font: { color: '#7C5112', bold: true } } });

  const widths = [13, 10, 10, 17, 28, 16, 12, 11, 18, 15, 28, 30, 26, 13];
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, 1, 1).format.columnWidth = width;
  });
  sheet.freezePanes.freezeRows(8);
  sheet.tables.add('A8:N12', true, 'TripTemplateItinerary');
}

const workbook = Workbook.create();
createReadMe(workbook);
createTripTemplate(workbook);

const inspection = await workbook.inspect({
  kind: 'table',
  range: 'Trip Template!A1:N12',
  include: 'values,formulas',
  tableMaxRows: 12,
  tableMaxCols: 14,
});
console.log(inspection.ndjson);

const formulaErrors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 50 },
  summary: 'formula error scan',
});
console.log(formulaErrors.ndjson);

await fs.mkdir(outputDir, { recursive: true });
for (const [sheetName, fileName, range] of [
  ['Read Me', 'read-me-preview.png', 'A1:H19'],
  ['Trip Template', 'trip-template-preview.png', 'A1:N12'],
]) {
  const preview = await workbook.render({ sheetName, range, scale: 1.5, format: 'png' });
  await fs.writeFile(`${outputDir}/${fileName}`, new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`Saved ${outputPath}`);
