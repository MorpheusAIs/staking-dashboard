import { Container } from "@chakra-ui/react";
import { SubnetStaking } from "staking-dashboard/containers/SubnetStaking";

export default function SubnetPage() {
  return (
    <Container maxW="4xl" width="full" height={"full"} pt={8} flex={1} minW={0}>
      <SubnetStaking />
    </Container>
  );
}
