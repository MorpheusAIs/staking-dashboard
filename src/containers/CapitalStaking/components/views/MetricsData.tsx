"use client";
import { Grid, GridItem, Skeleton, Stack, Text } from "@chakra-ui/react";
import { formatMetricsValue } from "../../helper";
import { Metrics } from "../../type";
import { memo } from "react";

export type MetricsDataProps = {
  metrics: Metrics;
  isLoading: boolean;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const MetricsData: React.FC<MetricsDataProps> = memo((props) => {
  const { metrics, isLoading } = props;

  // =============== VARIABLES
  const metricsToDisplay = [
    {
      index: 0,
      value: `$${metrics.stakedValue}`,
      label: "Deposits Value",
    },
    {
      index: 1,
      value: formatMetricsValue(metrics.dailyEmissionsEarned, false),
      label: "Current Daily Rewards",
      tooltipText:
        "Projection of what you'll earn per day going forward based on your current deposit",
      postFix: "MOR",
    },
    {
      index: 3,
      value: formatMetricsValue(metrics.totalAvailableToClaim, true),
      label: "Claimable Rewards",
      tooltipText:
        "Actual rewards that have already accrued and can be withdrawn at unlock date",
      postFix: "MOR",
    },
    {
      index: 4,
      label: "Total MOR Earned",
      value: formatMetricsValue(metrics.lifetimeEmissionsEarned, false),
      tooltipText: "Historical total of MOR rewards earned from staking.",
      postFix: "MOR",
    },
  ];

  // =============== RENDER FUNCTIONS
  const renderMetrics = () => {
    if (isLoading) {
      return [0, 1, 2, 3].map((i) => (
        <GridItem key={i}>
          <Skeleton background={"card"} height={95} borderRadius={"md"} />
        </GridItem>
      ));
    }

    return metricsToDisplay.map((metric) => (
      <GridItem key={metric.index}>
        <Stack
          height={"100%"}
          background={"card"}
          borderRadius={"md"}
          px={5}
          py={3}
          gap={1}
          border="1px solid"
          borderColor="border"
        >
          <Text fontSize={"0.85rem"} color="gray.200">
            {metric.label}
          </Text>
          <Text fontSize="xl" fontWeight="bold">
            {metric.value}{" "}
            {metric.postFix && (
              <span
                style={{
                  fontSize: "14px",
                }}
              >
                {metric.postFix}
              </span>
            )}
          </Text>
        </Stack>
      </GridItem>
    ));
  };

  // =============== VIEWS
  return (
    <Grid
      templateColumns={{
        base: "repeat(1, 1fr)",
        sm: "repeat(2, 1fr)",
        lg: "repeat(4, 1fr)",
      }}
      width="full"
      gap={2.5}
    >
      {renderMetrics()}
    </Grid>
  );
});

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default MetricsData;
