import dayjs from "dayjs";

// Utility function to format currency values
export const formatCurrency = (
  value: number,
  currency: string = "ZAR",
): string => {
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    // Fallback: format as R with two decimals
    return `R${value.toFixed(2)}`;
  }
};

// Utility function to format subscription renewal dates
export const formatSubscriptionDateTime = (value?: string): string => {
  if (!value) return "Not provided";
  const parseDate = dayjs(value);
  return parseDate.isValid() ? parseDate.format("DD/MM/YYYY") : "Not provided";
};

// Utility function to format subscription status labels
export const formatStatusLabel = (value?: string): string => {
  if (!value) return "Uknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
};
