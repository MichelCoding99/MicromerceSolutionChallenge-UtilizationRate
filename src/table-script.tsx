import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useMemo } from "react";
import sourceData from "./source-data.json";
import type {
  SourceDataType,
  TableDataType,
  Employee,
  ExternalEmployee,
} from "./types";
import dayjs from "dayjs"; // for date handling
import type { MonthlyFinancialEntry } from "./types";

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

/**
 * Helper function to format numeric values as percentages (rounded to whole numbers).
 * Handles 'null', 'undefined', or non-numeric strings by returning 'N/A' or '-'.
 * @param {string | null | undefined} value - The value to format.
 * @returns {string} The formatted percentage string or a placeholder.
 */
const formatPercentage = (value: string | null | undefined): string => {
  if (value === null || value === undefined) {
    return "N/A"; // Displays 'N/A' for completely missing values
  }
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return "-"; // Displays '-' if value is not a valid number
  }
  // Multiplies by 100 for percentage and rounds to whole numbers.
  return `${(numValue * 100).toFixed(0)}%`; // Rounding up to whole percentages
};

/**
 * Helper function for safely parsing strings into floating-point numbers.
 * Converts 'null', 'undefined', the string "null", or empty strings to 0.
 * Returns 0 if parseFloat would result in NaN.
 * @param {string | null | undefined} value - The value to parse.
 * @returns {number} The parsed number or 0.
 */
const parseSafeFloat = (value: string | null | undefined): number => {
  // check for null, undefined and string "null"
  if (
    value === null ||
    value === undefined ||
    value === "null" ||
    String(value).trim() === ""
  ) {
    return 0;
  }
  const num = parseFloat(value);
  // If parseFloat returns NaN, return 0 instead.
  return isNaN(num) ? 0 : num;
};

/**
 * Calculates the net earnings for the previous month for a given person.
 * This is calculated as (previous month's potential earnings - monthly salary).
 * The "previous month" is determined dynamically based on the latest entry in the earnings data.
 * @param {Employee | ExternalEmployee} personData - The raw data of the person (employee or external).
 * @returns {string} The formatted net earnings as a string (e.g., "1234.56 EUR").
 */
const calculateNetEarningsPrevMonth = (
  personData: Employee | ExternalEmployee
): string => {
  const costsByMonthData = personData?.costsByMonth;

  let earningsDataArray: MonthlyFinancialEntry[] = [];

  // Determines which array contains the monthly earnings.
  // For 'employees' it's 'potentialEarningsByMonth', for 'externals' it's 'costsByMonth' directly.
  if (costsByMonthData?.potentialEarningsByMonth) {
    // for employees
    earningsDataArray = costsByMonthData.potentialEarningsByMonth;
  } else if (costsByMonthData?.costsByMonth) {
    // for externals
    earningsDataArray = costsByMonthData.costsByMonth;
  }
  // If there is no array, earningsDataArray stays empty.

  // Safely retrieves the monthly salary, converting 'null' or empty strings to 0.
  const monthlySalaryStr = personData?.statusAggregation?.monthlySalary;
  const monthlySalary = parseSafeFloat(monthlySalaryStr);

  // Early exit if no earnings data is available
  if (earningsDataArray.length === 0) {
    return "- EUR";
  }

  // Determines the latest month in the dataset to define the "previous month".
  // It is assumed that the array is already sorted chronologically (latest entry last).
  const latestDataMonthEntry = earningsDataArray[earningsDataArray.length - 1];

  // Checks if the latest entry and its month are valid
  if (!latestDataMonthEntry || !latestDataMonthEntry.month) {
    return "- EUR";
  }

  // Calculates the previous month based on the latest date entry
  const referenceMonth = dayjs(latestDataMonthEntry.month); // E.g., '2024-07' becomes a dayjs object
  const previousMonth = referenceMonth.subtract(1, "month"); // Subtracts one month
  const previousMonthFormatted = previousMonth.format("YYYY-MM"); // Formats as "YYYY-MM" (e.g., "2024-06")

  let earningsPrevMonth = 0;

  // Finds the entry for the calculated previous month in the earnings array
  const prevMonthEntry = earningsDataArray.find(
    (entry: MonthlyFinancialEntry) => entry.month === previousMonthFormatted
  );

  // Safely retrieves the previous month's earnings, converting 'null' or empty strings to 0.
  if (prevMonthEntry && prevMonthEntry.costs) {
    earningsPrevMonth = parseFloat(prevMonthEntry.costs);
  }

  // Calculates the net earnings
  const netEarnings = earningsPrevMonth - monthlySalary;

  // Formats the result to two decimal places and appends " EUR".
  return `${netEarnings.toFixed(2)} EUR`;
};

/**
 * Main data processing logic for the table.
 * Filters active persons and transforms raw data into the 'TableDataType' format.
 */
const tableData: TableDataType[] = (sourceData as unknown as SourceDataType[])
  .filter((dataRow) => {
    // Only Filter lines, that have a 'employees'- or 'externals'-Object.
    return dataRow.employees || dataRow.externals;
  })
  .map((dataRow) => {
    // Extracts the relevant person data, whether it's an employee or an external.
    const personData = dataRow.employees || dataRow.externals; // It's either a employee or a external

    // Checks the person's status.
    const isActive =
      personData?.statusAggregation?.status === "active" ||
      personData?.status === "active";

    // Only process active employees/externals
    if (!isActive) {
      return null;
    }

    // person name extraction
    const personName = personData?.name || "";

    // Calculates and formats the utilization rate for the past 12 months.
    const past12MonthsValue = formatPercentage(
      personData?.workforceUtilisation?.utilisationRateLastTwelveMonths
    );

    // Calculates and formats the "Year-to-Date" utilization rate.
    const y2dValue = formatPercentage(
      personData?.workforceUtilisation?.utilisationRateYearToDate
    );

    // Retrieves the data for the last three months of utilization.
    const lastThreeMonths =
      personData?.workforceUtilisation?.lastThreeMonthsIndividually || [];
    // Assigns the utilization of the last three months to the fixed columns
    const juneValue = formatPercentage(lastThreeMonths[2]?.utilisationRate);
    const julyValue = formatPercentage(lastThreeMonths[1]?.utilisationRate);
    const augustValue = formatPercentage(lastThreeMonths[0]?.utilisationRate);

    // Calculates the net earnings for the previous month.
    const netEarningsPrevMonthValue = calculateNetEarningsPrevMonth(
      personData as Employee | ExternalEmployee
    );

    // Creates the final data object for a table row.
    const row: TableDataType = {
      person: personName,
      past12Months: past12MonthsValue,
      y2d: y2dValue,
      june: juneValue,
      july: julyValue,
      august: augustValue,
      netEarningsPrevMonth: netEarningsPrevMonthValue,
    };

    return row;
  })
  // Removes all rows that were marked as null (inactive persons).
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
        accessorKey: "june",
        header: "June",
      },
      {
        accessorKey: "july",
        header: "July",
      },
      {
        accessorKey: "august",
        header: "August",
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
