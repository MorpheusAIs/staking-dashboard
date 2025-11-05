import { Container } from "@chakra-ui/react";
import { CapitalStaking } from "staking-dashboard/containers/CapitalStaking";
export default function CapitalPage() {
  return (
    <Container maxW="4xl" width="full" height={"full"} pt={8} flex={1} minW={0}>
      <CapitalStaking />
    </Container>
  );
}
