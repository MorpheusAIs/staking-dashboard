"use client";
import { VStack, Text, HStack, Input, Menu, Box } from "@chakra-ui/react";
import { FieldErrors } from "react-hook-form";
import { GoChevronDown } from "react-icons/go";
import { TimeUnit } from "staking-dashboard/lib/powerFactorUtils";

export type LockPeriodDuration = {
  duration: string;
  unit: TimeUnit;
};

export type LockPeriodSelectorProps = {
  field: {
    onChange: (value: { duration: number | string; unit: TimeUnit }) => void;
    value: { duration: number | string; unit: TimeUnit };
  };
  errors: FieldErrors<{
    lockDuration: LockPeriodDuration;
  }>;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const LockPeriodSelector: React.FC<LockPeriodSelectorProps> = (
  props
) => {
  const { field, errors } = props;

  // =============== VARIABLES
  const timeUnits: TimeUnit[] = ["Days", "Months", "Years"];

  // =============== VIEWS
  return (
    <VStack width="full" alignItems="flex-start" mt={4}>
      <Text fontSize="sm" fontWeight="medium">
        MOR Claims Lock Period
      </Text>

      <Text fontSize="xs" color="secondaryText" lineHeight="1.4" mb={1}>
        Minimum 7 days required. Locking MOR claims increases your power factor
        for future rewards but delays claiming. Power Factor activates after
        ~7-8 months, scales up to x10.7 at ~7 years, and remains capped at x10.7
        for longer periods.
      </Text>

      <HStack width="full" gap={2}>
        <Input
          value={field.value?.duration ?? ""}
          placeholder="Enter duration"
          css={{ "--focus-color": "{colors.primary}" }}
          onChange={(e) => {
            if (e.target.value === "") {
              field.onChange({ ...field.value, duration: "" });
              return;
            }
            field.onChange({
              ...field.value,
              duration: Number(e.target.value),
            });
          }}
        />

        <Menu.Root>
          <Menu.Trigger asChild>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap={2}
              px={{ base: 5, md: 4 }}
              py={2}
              border="1px solid"
              width={"30%"}
              borderColor="border"
              borderRadius={"sm"}
              color="white"
              cursor="pointer"
              _hover={{ bg: "gray.700" }}
            >
              {field.value?.unit ?? "Days"}
              <GoChevronDown />
            </Box>
          </Menu.Trigger>

          <Menu.Positioner>
            <Menu.Content>
              {timeUnits.map((unit) => (
                <Menu.Item
                  key={unit}
                  onClick={() => field.onChange({ ...field.value, unit })}
                  value={unit}
                  py={2}
                  cursor="pointer"
                  _hover={{ bg: "gray.700" }}
                >
                  {unit}
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </HStack>

      {(errors.lockDuration?.duration || errors.lockDuration?.unit) && (
        <Text color="red.400" fontSize="xs">
          {errors.lockDuration.duration?.message ||
            errors.lockDuration.unit?.message}
        </Text>
      )}
    </VStack>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default LockPeriodSelector;
