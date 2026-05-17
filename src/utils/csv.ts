type CsvRecord = Record<string, string | number | boolean | undefined>;

function escapeCsvValue(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function createCsvContent(records: CsvRecord[], fields: string[]): string {
  const header = fields.join(",");
  const rows = records.map((record) =>
    fields
      .map((field) => {
        const rawValue = record[field];
        const value = rawValue === undefined || rawValue === null ? "" : String(rawValue);
        return escapeCsvValue(value);
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}
