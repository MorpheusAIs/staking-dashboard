import { Container, Stack } from "@chakra-ui/react";
import { SubnetStaking } from "staking-dashboard/containers/SubnetStaking";
import { SUBNET_CONFIG } from "staking-dashboard/lib/configs/subnet.config";

const title = `${SUBNET_CONFIG.name} Subnet Staking`;
const description = SUBNET_CONFIG.description;
const url = SUBNET_CONFIG.url;

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url,
    siteName: title,
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: description,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/logo.png"],
  },
};

export default function SubnetPage() {
  return (
    <Container
      maxW="5xl"
      width="full"
      height={"100%"}
      flex={1}
      minW={0}
      mt={{ base: 12, lg: 6 }}
    >
      <Stack justifyContent={"center"} alignItems={"center"} height={"full"}>
        <SubnetStaking />
      </Stack>
    </Container>
  );
}
