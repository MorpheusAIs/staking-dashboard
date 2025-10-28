import { BsStack } from "react-icons/bs";
import { FaArrowTrendUp } from "react-icons/fa6";
import { FaTelegramPlane } from "react-icons/fa";
import { CiMail } from "react-icons/ci";
import { FaXTwitter } from "react-icons/fa6";

export const SideBarItems = [
  {
    id: 1,
    title: "Subnet",
    icon: <BsStack size={18} />,
    path: "/subnet",
  },
  {
    id: 2,
    title: "Capital",
    icon: <FaArrowTrendUp size={18} />,
    path: "/capital",
  },
];

export const SocialMediaLinks = [
  {
    id: 1,
    title: "Telegram",
    url: "",
    icon: <FaTelegramPlane size={22} />,
  },
  {
    id: 2,
    title: "Twitter",
    url: "",
    icon: <FaXTwitter size={22} />,
  },
  {
    id: 3,
    title: "Email",
    url: "",
    icon: <CiMail size={22} />,
  },
];
