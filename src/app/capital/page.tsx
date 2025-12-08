import { Container, Stack } from "@chakra-ui/react";
import { CapitalStaking } from "staking-dashboard/containers/CapitalStaking";
export default function CapitalPage() {
  return (
    <Container
      maxW="4xl"
      width="full"
      height={"calc(100vh - 155px)"}
      flex={1}
      minW={0}
    >
      <Stack justifyContent={"center"} alignItems={"center"} height={"full"}>
        <CapitalStaking />
      </Stack>
    </Container>
  );
}
