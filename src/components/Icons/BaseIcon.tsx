export const BaseIcon = ({
  size = 18,
  className = "",
  fill = "#fff",
}: {
  size?: number;
  className?: string;
  fill?: string;
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        fill={fill}
        d="M11.984 21C16.964 21 21 16.97 21 12s-4.036-9-9.016-9C7.26 3 3.384 6.627 3 11.244h11.917v1.513H3C3.385 17.373 7.26 21 11.984 21"
      />
    </svg>
  );
};
