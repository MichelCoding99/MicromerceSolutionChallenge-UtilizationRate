import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useMemo } from "react";
import sourceData from "./source-data.json";
import type { SourceDataType, TableDataType } from "./types";

/**
 * Example of how a tableData object should be structured.
 *
 * Each `row` object has the following properties:
 * @prop {string} person - The full name of the employee.
 * @prop {number} past12Months - The value for the past 12 months.
 * @prop {number} y2d - The year-to-date value.
 * @prop {number} may - The value for May.
 * @prop {number} june - The value for June.
 * @prop {number} july - The value for July.
 * @prop {number} netEarningsPrevMonth - The net earnings for the previous month.
 */

const tableData: TableDataType[] = (sourceData as unknown as SourceDataType[])
  .filter((dataRow) => {
    // Only Filter lines, that have a 'employees'- or 'externals'-Object.
    return dataRow.employees || dataRow.externals;
  })
  .map((dataRow) => {
    const personData = dataRow.employees || dataRow.externals; // It's either a employee or a external

    // Check the status
    const isActive =
      personData?.statusAggregation?.status === "active" ||
      personData?.status === "active";

    // Only process active employees/externals
    if (!isActive) {
      return null;
    }

    // person name extraction
    const personName = personData?.name || "";

    const row: TableDataType = {
      person: personName,
      past12Months: `past12Months placeholder`,
      y2d: `y2d placeholder`,
      may: `may placeholder`,
      june: `june placeholder`,
      july: `july placeholder`,
      netEarningsPrevMonth: `netEarningsPrevMonth placeholder`,
    };

    return row;
  })
  .filter((row) => row != null) as TableDataType[]; // remove null-entries

const Example = () => {
  const columns = useMemo<MRT_ColumnDef<TableDataType>[]>(
    () => [
      {
        accessorKey: "person",
        header: "Person",
      },
      {
        accessorKey: "past12Months",
        header: "Past 12 Months",
      },
      {
        accessorKey: "y2d",
        header: "Y2D",
      },
      {
        accessorKey: "may",
        header: "May",
      },
      {
        accessorKey: "june",
        header: "June",
      },
      {
        accessorKey: "july",
        header: "July",
      },
      {
        accessorKey: "netEarningsPrevMonth",
        header: "Net Earnings Prev Month",
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: tableData,
  });

  return <MaterialReactTable table={table} />;
};

export default Example;
