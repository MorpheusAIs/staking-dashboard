"use client";
import { Button, Input, InputGroup, Text, VStack } from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

export type WithdrawFormProps = {};

const schema = yup.object({
  withdrawAmount: yup
    .number()
    .typeError("Enter a valid number")
    .positive("Must be greater than 0")
    .required("Required"),
});

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const WithdrawForm: React.FC<WithdrawFormProps> = () => {
  // =============== HOOKS
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      withdrawAmount: 0,
    },
  });
  // =============== STATE

  // =============== API

  // =============== EVENTS
  const onSubmit = () => {};

  // =============== VARIABLES

  // =============== RENDER FUNCTIONS

  // =============== VIEWS
  return (
    <VStack
      p={4}
      bg="card"
      borderRadius="md"
      width="full"
      border="1px solid"
      borderColor="border"
      gap={4}
    >
      <VStack alignItems={"flex-start"} width="full">
        <Text fontSize={"xl"} fontWeight={"medium"}>
          Withdraw MOR
        </Text>
      </VStack>{" "}
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
        <VStack width="full" gap={3}>
          <Controller
            name="withdrawAmount"
            control={control}
            render={({ field }) => (
              <VStack width="full" alignItems={"flex-start"}>
                <Text fontSize={"xs"}>Amount to withdraw</Text>
                <InputGroup
                  endElement={
                    <Button
                      size="2xs"
                      borderColor="primary"
                      borderRadius={"xs"}
                      color="primary"
                      variant={"outline"}
                    >
                      Max
                    </Button>
                  }
                >
                  <Input
                    {...field}
                    placeholder="Enter amount"
                    type="number"
                    min={0}
                    step={0.01}
                  />
                </InputGroup>
                {errors.withdrawAmount && (
                  <Text color="red.400" fontSize="sm" mt={1}>
                    {errors.withdrawAmount.message}
                  </Text>
                )}
              </VStack>
            )}
          />
          <Button
            type="submit"
            bgColor="primary"
            color="white"
            width={"full"}
            borderRadius={"sm"}
          >
            Withdraw MOR
          </Button>
        </VStack>
      </form>
    </VStack>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default WithdrawForm;
