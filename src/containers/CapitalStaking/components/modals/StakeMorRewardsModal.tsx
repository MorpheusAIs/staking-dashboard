"use client";
import {
  Portal,
  Dialog,
  Stack,
  Text,
  HStack,
  useRecipe,
  Button,
  CloseButton,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useCapitalStaking } from "staking-dashboard/hooks/useCapitalStaking";
import { SUBNET_CONFIG } from "staking-dashboard/lib/configs/subnet.config";
import { buttonRecipe } from "staking-dashboard/lib/configs/theme";

export type StakeMorRewardsModalProps = {
  open: boolean;
  onHandleOpen: (open: boolean) => void;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const StakeMorRewardsModal: React.FC<StakeMorRewardsModalProps> = (
  props
) => {
  const { open, onHandleOpen } = props;

  // =============== HOOKS
  const { totalClaimableAmountFormatted } = useCapitalStaking();
  const router = useRouter();

  // =============== STATE
  const recipe = useRecipe({ recipe: buttonRecipe });

  // =============== EVENTS
  const onHandleNavigateSubnetStaking = () => {
    router.push("/subnet");
  };

  // =============== VARIABLES
  const styles = recipe({ visual: "solid" });

  // =============== VIEWS
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        onHandleOpen(e.open);
      }}
      lazyMount
      placement={"center"}
      trapFocus={false}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header pb={0}>
              <Dialog.Title color="primary">Stake MOR Rewards</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                <Text color="gray.400">
                  Earn additional benefits and support the growing ecosystem of
                  developers building on Morpheus by staking your MOR to a
                  builder subnet.
                </Text>
              </Stack>
              <HStack
                mt={4}
                bg="card"
                px={{ base: 5, md: 4 }}
                py={{ base: 3.5, md: 4.5 }}
                justifyContent={"space-between"}
                borderRadius={"sm"}
              >
                <Text fontSize={"md"}>Total Rewards Earned</Text>
                <Text fontSize={"md"} fontWeight={"bold"}>
                  {totalClaimableAmountFormatted || "0"} MOR
                </Text>
              </HStack>
              <Button
                css={styles}
                mt={6}
                width="full"
                onClick={onHandleNavigateSubnetStaking}
              >
                Stake to {SUBNET_CONFIG.name || "Our Builder Subnet"}
              </Button>
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default StakeMorRewardsModal;
