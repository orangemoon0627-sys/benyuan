import nextVitals from "eslint-config-next";

const eslintConfig = [
  {
    ignores: [
      "mobile/.android-sdk/**",
      "mobile/.flutter-sdk/**",
      "mobile/.gradle/**",
      "mobile/DerivedData/**",
      "output/**",
    ],
  },
  ...nextVitals,
];

export default eslintConfig;
