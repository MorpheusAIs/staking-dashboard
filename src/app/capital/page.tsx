import { Container, Stack } from "@chakra-ui/react";
import { CapitalStaking } from "staking-dashboard/containers/CapitalStaking";
import CapitalStakingProvider from "staking-dashboard/containers/CapitalStakingProvider";
import ModalProvider from "staking-dashboard/containers/ModalProvider";
import { SUBNET_CONFIG } from "staking-dashboard/lib/configs/subnet.config";

const title = `${SUBNET_CONFIG.name} Capital Staking`;
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

export default function CapitalPage() {
  return (
    <Container
      maxW="5xl"
      width="full"
      height={"calc(100vh - 155px)"}
      flex={1}
      minW={0}
      mt={{ base: 12, lg: 0 }}
    >
      <Stack justifyContent={"center"} alignItems={"center"} height={"full"}>
        <ModalProvider>
          <CapitalStakingProvider>
            <CapitalStaking />
          </CapitalStakingProvider>
        </ModalProvider>
      </Stack>
    </Container>
  );
}
