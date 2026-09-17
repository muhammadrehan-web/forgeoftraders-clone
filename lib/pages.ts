import type { Metadata } from "next";

type PageConfig = {
  file: string;
  metadata: Metadata;
};

const siteName = "Forge of Traders";

export const pages = {
  home: {
    file: "home.html",
    metadata: {
      title: "Forge of Traders | Simulated Trading Evaluations",
      description:
        "Access simulated trading evaluations and accounts with clear risk rules, real-market data and performance rewards based on eligible simulated results.",
    },
  },
  affiliate: {
    file: "affiliate.html",
    metadata: {
      title: `Affiliate | ${siteName}`,
      description: "Join the Forge of Traders affiliate program.",
    },
  },
  careers: {
    file: "careers.html",
    metadata: {
      title: `Careers | ${siteName}`,
      description: "Careers at Forge of Traders.",
    },
  },
  contact: {
    file: "contact.html",
    metadata: {
      title: `Contact | ${siteName}`,
      description: "Contact Forge of Traders support.",
    },
  },
  evaluation: {
    file: "evaluation.html",
    metadata: {
      title: `Evaluation | ${siteName}`,
      description: "Forge of Traders evaluation programs.",
    },
  },
  faqs: {
    file: "faqs.html",
    metadata: {
      title: `FAQs | ${siteName}`,
      description: "Frequently asked questions about Forge of Traders.",
    },
  },
  "privacy-policy": {
    file: "privacy-policy.html",
    metadata: {
      title: `Privacy Policy | ${siteName}`,
      description: "Forge of Traders privacy policy.",
    },
  },
  symbols: {
    file: "symbols.html",
    metadata: {
      title: `Symbols | ${siteName}`,
      description: "Trading symbols available at Forge of Traders.",
    },
  },
  "terms-conditions": {
    file: "terms-conditions.html",
    metadata: {
      title: `Terms & Conditions | ${siteName}`,
      description: "Forge of Traders terms and conditions.",
    },
  },
  "compare-programs": {
    file: "compare-programs.html",
    metadata: {
      title: `Compare Programs | ${siteName}`,
      description: "Compare Forge of Traders evaluation programs.",
    },
  },
} as const satisfies Record<string, PageConfig>;

export type PageId = keyof typeof pages;
