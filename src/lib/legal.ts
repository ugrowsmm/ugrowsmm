export type LegalSlug = 'terms' | 'privacy' | 'refund' | 'cookies'

export interface LegalSection {
  id: string
  title: string
  paragraphs?: string[]
  list?: string[]
  note?: string
}

export interface LegalDoc {
  slug: LegalSlug
  path: string
  navLabel: string
  title: string
  subtitle: string
  updated: string
  intro: string
  sections: LegalSection[]
}

const UPDATED = '19 October 2026'

export const LEGAL_DOCS: Record<LegalSlug, LegalDoc> = {
  terms: {
    slug: 'terms',
    path: '/terms',
    navLabel: 'Terms of Service',
    title: 'Terms of Service',
    subtitle: 'The rules that keep the UGrowSMM panel fair, safe and predictable for everyone.',
    updated: UPDATED,
    intro:
      'These Terms of Service form a binding agreement between you and UGrowSMM. They explain how you may access the panel, place orders, use your wallet and API key, and what happens if something goes wrong. Please read them before you create an account or submit an order.',
    sections: [
      {
        id: 'about',
        title: 'About us and these terms',
        paragraphs: [
          'UGrowSMM operates a social media marketing (SMM) panel that lets registered users purchase engagement services such as followers, likes, views, members and plays for supported social platforms.',
          'By registering, adding funds, placing an order or using the API, you confirm that you have read and accepted these Terms, our Privacy Policy and our Refund Policy. If you do not agree, please do not use the panel.',
        ],
      },
      {
        id: 'eligibility',
        title: 'Eligibility and your account',
        list: [
          'You must be at least 18 years old and legally able to enter into a contract.',
          'Provide accurate account information and keep it up to date.',
          'Keep your password, two-factor codes and API key confidential. You are responsible for activity performed with your credentials.',
          'One person or organisation should maintain one account unless we agree otherwise in writing.',
          'Notify us immediately at support@ugrowsmm.com if you believe your account or API key has been compromised.',
        ],
      },
      {
        id: 'services',
        title: 'Our services',
        paragraphs: [
          'Services are delivered through third-party providers and platform interfaces. Availability, minimum and maximum quantities, start times and rates are shown in the service catalogue and may change without notice.',
          'We are an independent service. We are not affiliated with, endorsed by, or sponsored by Instagram, Meta, YouTube, Google, X, Telegram, Spotify or any other platform referenced on the panel.',
          'Social platforms update their systems frequently. While we use safeguards such as gradual delivery and refill protection, we cannot guarantee that a platform will never adjust, remove or reverse engagement.',
        ],
      },
      {
        id: 'orders',
        title: 'Placing orders',
        list: [
          'You are responsible for the link, username and quantity you submit. Review them carefully before confirming payment.',
          'Orders must target public profiles, posts, channels or tracks that you own or are authorised to promote.',
          'Once an order is submitted it enters an automated queue and may begin within seconds. Changes may not be possible after processing starts.',
          'Delivery times are estimates based on normal conditions, not guaranteed deadlines.',
          'Start counts are recorded automatically and may differ slightly from what you see on the platform.',
        ],
        note:
          'Private accounts, deleted posts, restricted content and incorrect links can prevent or delay delivery. These are treated as user errors under our Refund Policy.',
      },
      {
        id: 'pricing',
        title: 'Pricing, wallet and payments',
        paragraphs: [
          'All prices are displayed in Indian Rupees (INR) and are charged per 1,000 units unless stated otherwise. The total charge is shown before you confirm an order.',
          'The panel works on a prepaid wallet. Funds are added in advance and are used to pay for orders. Wallet balances are non-transferable and cannot be withdrawn or exchanged for cash, except where required by law.',
          'Promotional bonus credit may be offered from time to time. Bonus credit has no cash value, can expire, and may be reversed if an associated top-up is refunded.',
          'This website is a demonstration model. No real payment is collected and no real order is fulfilled. Payment flows shown here are simulated for design evaluation only.',
        ],
      },
      {
        id: 'delivery',
        title: 'Delivery, refill and guarantees',
        paragraphs: [
          'We aim to start every order within the window shown on the service. High-volume orders, platform congestion or provider maintenance can extend delivery.',
          'If delivery has not started within 24 hours, or an order stalls before completion, contact support with the order ID. We will investigate and, where appropriate, restart, refill or refund the remaining quantity.',
          'Refill protection applies for 30 days on eligible services where stated. Refills cover drops that occur within the protection window and exclude changes caused by you deleting the post, changing the account or violating platform rules.',
        ],
      },
      {
        id: 'refunds',
        title: 'Refunds and cancellations',
        paragraphs: [
          'Cancellations may be requested before processing begins. Refunds are normally issued as wallet credit; the full rules, timelines and exclusions are set out in our Refund Policy.',
          'Nothing in these Terms limits any rights you have under applicable consumer protection law.',
        ],
      },
      {
        id: 'prohibited',
        title: 'Prohibited uses',
        list: [
          'Using the panel for unlawful, fraudulent, deceptive or harmful activity.',
          'Targeting accounts you do not own or have permission to promote.',
          'Harassment, hate speech, election manipulation, adult content involving minors, malware or illegal products.',
          'Attempting to bypass quantity limits, payment controls, rate limits or security measures.',
          'Reselling services without authorisation, scraping the API, or using automated requests that degrade the platform.',
          'Violating the terms of the social platforms you use. You are responsible for how you apply purchased engagement.',
        ],
      },
      {
        id: 'ip',
        title: 'Intellectual property',
        paragraphs: [
          'The UGrowSMM name, logo, interface, software and documentation are owned by us or our licensors and are protected by intellectual property laws. You receive a limited, non-exclusive, non-transferable licence to use the panel for its intended purpose.',
          'You retain ownership of the links and content you submit. You grant us a limited licence to process that content solely to provide the services.',
        ],
      },
      {
        id: 'disclaimers',
        title: 'Disclaimers and limitation of liability',
        paragraphs: [
          'The panel is provided on an “as available” basis. To the maximum extent permitted by law, we disclaim implied warranties of merchantability, fitness for a particular purpose and non-infringement.',
          'To the maximum extent permitted by law, our total liability for any claim relating to an order is limited to the amount you paid for that order in the 30 days before the claim. We are not liable for indirect, incidental, special or consequential losses.',
        ],
      },
      {
        id: 'termination',
        title: 'Suspension and termination',
        paragraphs: [
          'We may suspend or terminate an account for fraud, payment abuse, chargebacks, prohibited content, security threats or repeated violations of these Terms. Where practical, we will explain the reason and give you an opportunity to respond.',
          'You may delete your account at any time from Settings. Deleting your account removes your profile and demo data from this browser. Obligations that by their nature survive termination, including payment and liability provisions, will continue to apply.',
        ],
      },
      {
        id: 'changes',
        title: 'Changes to these terms',
        paragraphs: [
          'We may update these Terms to reflect new features, legal requirements or operational changes. The updated date at the top of this page shows the latest revision. Material changes will be communicated through the panel or by email before they take effect.',
        ],
      },
      {
        id: 'law',
        title: 'Governing law and contact',
        paragraphs: [
          'These Terms are governed by the laws of India. Subject to applicable consumer protections, the courts of Mumbai, Maharashtra have exclusive jurisdiction over disputes.',
          'Questions about these Terms? Email support@ugrowsmm.com or use the contact options in your account.',
        ],
      },
    ],
  },
  privacy: {
    slug: 'privacy',
    path: '/privacy',
    navLabel: 'Privacy Policy',
    title: 'Privacy Policy',
    subtitle: 'What we collect, why we need it, and the control you have over your data.',
    updated: UPDATED,
    intro:
      'UGrowSMM respects your privacy. This policy explains the personal information we process when you visit the panel, create an account, place orders or use the API, and the choices available to you.',
    sections: [
      {
        id: 'scope',
        title: 'Scope of this policy',
        paragraphs: [
          'This policy applies to the UGrowSMM website, dashboard, API and support channels. It does not apply to third-party platforms you interact with, which have their own privacy policies.',
          'The current panel is a demonstration model. It stores demo account and order data only in your browser’s local storage. No real payment or personal data is sent to a production server.',
        ],
      },
      {
        id: 'collect',
        title: 'Information we collect',
        list: [
          'Account details: name, username, email address, phone number and country.',
          'Authentication data: password hashes and, when enabled, two-factor authentication secrets. We never store plain-text passwords.',
          'Order data: service, target link, quantity, charge, delivery status and timestamps.',
          'Wallet and payment metadata: top-up amounts, method type and transaction references. Full card numbers are handled by payment processors and are not stored by us.',
          'Technical data: IP address, browser and device information, pages visited and security logs.',
          'API data: key identifiers, request metadata and usage counters. API keys are stored in hashed form in production environments.',
          'Support communications: messages, attachments and order references you share with us.',
        ],
      },
      {
        id: 'use',
        title: 'How we use your information',
        list: [
          'To create and secure your account and authenticate sign-ins.',
          'To process wallet top-ups and deliver orders through fulfilment partners.',
          'To provide order tracking, notifications, refunds and customer support.',
          'To detect fraud, abuse, chargebacks and unauthorised API activity.',
          'To improve the panel, measure performance and develop new services.',
          'To comply with legal, tax and accounting obligations and enforce our Terms.',
        ],
        note:
          'We do not sell your personal information. We do not use your order links or account data for advertising in this demo.',
      },
      {
        id: 'bases',
        title: 'Legal bases for processing',
        paragraphs: [
          'Where applicable law requires a legal basis, we rely on performance of our contract with you (providing the panel), our legitimate interests (security, fraud prevention and service improvement), your consent (optional marketing communications), and compliance with legal obligations.',
          'If you are in India, we process personal data in line with the Digital Personal Data Protection Act, 2023 and other applicable laws. You may withdraw consent at any time without affecting processing that already took place.',
        ],
      },
      {
        id: 'cookies',
        title: 'Cookies and local storage',
        paragraphs: [
          'We use a small number of cookies and browser storage entries to keep you signed in, remember preferences and protect the panel against abuse. See our Cookie Policy for the categories we use and how to manage them.',
        ],
      },
      {
        id: 'sharing',
        title: 'How we share information',
        list: [
          'Service providers: hosting, payment processing, email delivery, analytics and customer support tools acting on our instructions.',
          'Fulfilment partners: the minimum order details needed to deliver the engagement you purchased.',
          'Legal and safety: authorities or third parties when required by law, or to protect rights, safety and security.',
          'Business transfers: in connection with a merger, acquisition or sale of assets, subject to appropriate confidentiality.',
        ],
      },
      {
        id: 'transfers',
        title: 'International transfers',
        paragraphs: [
          'Some service providers may process data outside your country. Where required, we use contractual safeguards and reasonable technical measures to protect information during international transfers.',
        ],
      },
      {
        id: 'retention',
        title: 'How long we keep information',
        paragraphs: [
          'We retain account data while your account is active and for a reasonable period afterwards to meet legal, tax, fraud-prevention and dispute-resolution requirements. Order and transaction records are typically retained for up to 24 months unless a longer period is required by law.',
          'In this demo, data remains in your browser until you delete your account or clear site data.',
        ],
      },
      {
        id: 'security',
        title: 'How we protect your data',
        paragraphs: [
          'We use encryption in transit, access controls, hashed credentials, rate limiting and monitoring designed to protect account and payment information. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.',
          'If we become aware of a breach affecting your personal data, we will notify you and the relevant authorities as required by law.',
        ],
      },
      {
        id: 'rights',
        title: 'Your rights and choices',
        list: [
          'Access a copy of the personal data we hold about you.',
          'Correct inaccurate or incomplete information from your account settings.',
          'Request deletion of your account and associated data.',
          'Withdraw consent for optional communications and non-essential cookies.',
          'Object to or restrict certain processing, where applicable law provides that right.',
          'Lodge a complaint with a data protection authority.',
        ],
        note:
          'To exercise a right, email privacy@ugrowsmm.com. We may need to verify your identity before responding, and we will aim to reply within 30 days.',
      },
      {
        id: 'children',
        title: 'Children’s privacy',
        paragraphs: [
          'The panel is not intended for anyone under 18. We do not knowingly collect personal data from children. If you believe a minor has created an account, contact us and we will take appropriate action.',
        ],
      },
      {
        id: 'updates',
        title: 'Changes and contact',
        paragraphs: [
          'We may update this policy from time to time. The latest revision date is shown at the top of the page. Material changes will be communicated through the panel or by email.',
          'For privacy questions, contact privacy@ugrowsmm.com. For general support, write to support@ugrowsmm.com.',
        ],
      },
    ],
  },
  refund: {
    slug: 'refund',
    path: '/refund-policy',
    navLabel: 'Refund Policy',
    title: 'Refund Policy',
    subtitle: 'Clear, fair outcomes when delivery does not go to plan.',
    updated: UPDATED,
    intro:
      'SMM services are digital and begin processing almost immediately, so not every order can be refunded. This policy explains when you are eligible, how partial refunds work, and how to raise a request.',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        paragraphs: [
          'We want every order to be delivered in full, on time and as described. Where that does not happen, we will investigate and provide an appropriate solution: completion of the remaining order, a refill, wallet credit or a refund.',
          'This is a demonstration model. All payments and refunds shown in the panel are simulated. No real money is transferred.',
        ],
      },
      {
        id: 'before',
        title: 'Before you order',
        list: [
          'Check the service ID, platform and description in the catalogue.',
          'Make sure the target profile, post, channel or track is public and correct.',
          'Confirm the quantity is within the displayed minimum and maximum limits.',
          'Read the estimated start time; some services take several hours.',
          'Large orders may be drip-fed for safety and can take longer to complete.',
        ],
      },
      {
        id: 'eligible',
        title: 'When you may be eligible for a refund',
        list: [
          'The order was paid for but never started within the stated delivery window.',
          'A delivery failure or provider error prevented the order from completing.',
          'The service became unavailable and we could not fulfil an alternative.',
          'You were charged twice for the same order due to a technical error.',
          'The wrong quantity was delivered and the shortfall cannot be refilled.',
        ],
        note:
          'Eligibility is confirmed after reviewing the order, start count, delivery logs and provider response. Starting an order does not automatically make it non-refundable if the remaining quantity cannot be delivered.',
      },
      {
        id: 'not-eligible',
        title: 'When refunds are not available',
        list: [
          'The order was delivered in full and the engagement was visible on the platform at completion.',
          'Delivery has started and is progressing normally, even if it is slower than estimated.',
          'The link was private, incorrect, deleted or changed by you after ordering.',
          'The account was suspended, restricted or deleted by the platform.',
          'Engagement dropped due to a platform update, audit or policy enforcement outside the refill window.',
          'You changed your mind after processing began, or ordered a service that is explicitly non-refundable.',
          'The request is made after the 7-day claim window, or is linked to fraud, abuse or a chargeback.',
        ],
      },
      {
        id: 'partial',
        title: 'Partial refunds and refills',
        paragraphs: [
          'If an order is only partly delivered, we may refund the undelivered portion in proportion to the quantity not received. Alternatively, and with your agreement, we may refill the remaining quantity.',
          'Eligible services include 30-day refill protection. Refills cover drops within that window and exclude changes caused by you or by platform enforcement.',
        ],
      },
      {
        id: 'how',
        title: 'How to request a refund',
        list: [
          'Open Order History and copy the order ID.',
          'Email refunds@ugrowsmm.com within 7 days of the order date, or contact support from your account.',
          'Include the order ID, a short description of the issue and screenshots showing the current count.',
          'We will acknowledge your request within 48 hours and aim to resolve it within 5–7 business days.',
          'Do not open a chargeback or payment dispute before contacting us; it can slow the review and suspend your account.',
        ],
      },
      {
        id: 'method',
        title: 'Refund method and timing',
        paragraphs: [
          'Approved refunds are normally credited to your UGrowSMM wallet within one business day, so you can place a replacement order immediately. Where law requires, or where the original payment method is available and appropriate, we may refund to the source.',
          'Promotional bonus credit linked to a refunded top-up is reversed. Payment processing fees are non-refundable unless the error was ours. Bank settlement times depend on your provider and are typically 5–10 business days.',
        ],
      },
      {
        id: 'chargebacks',
        title: 'Chargebacks and disputes',
        paragraphs: [
          'Please contact us first so we can resolve the issue directly. Filing a chargeback for a delivered order, or for an order that has an active support case, may result in account suspension while the dispute is investigated.',
          'We may recover reasonable chargeback fees where a dispute is resolved in our favour and the fee is permitted by applicable law.',
        ],
      },
      {
        id: 'contact',
        title: 'Contact',
        paragraphs: [
          'Refund questions: refunds@ugrowsmm.com. General support: support@ugrowsmm.com. We will always try to find a practical solution before closing a case.',
        ],
      },
    ],
  },
  cookies: {
    slug: 'cookies',
    path: '/cookies',
    navLabel: 'Cookie Policy',
    title: 'Cookie Policy',
    subtitle: 'The small pieces of data that keep your panel secure and your preferences intact.',
    updated: UPDATED,
    intro:
      'This Cookie Policy explains how UGrowSMM uses cookies and similar technologies such as browser local storage. It should be read together with our Privacy Policy.',
    sections: [
      {
        id: 'what',
        title: 'What are cookies and local storage?',
        paragraphs: [
          'Cookies are small text files stored by your browser when you visit a website. Local storage is a similar browser feature that can hold data between visits without sending it with every request.',
          'Cookies can be “session” cookies that expire when you close the browser, or “persistent” cookies that remain for a set period. You can control them through your browser settings.',
        ],
      },
      {
        id: 'categories',
        title: 'Categories we use',
        list: [
          'Strictly necessary: required for sign-in, security, fraud prevention and core panel functionality. These cannot be switched off through the panel.',
          'Preferences: remember choices such as cookie consent, notification preferences and interface settings.',
          'Analytics: help us understand which features are used and how the panel performs. No third-party analytics are loaded in this demo.',
          'Marketing: used to measure campaigns and show relevant offers. Marketing cookies are optional and off by default in this demo.',
        ],
      },
      {
        id: 'storage',
        title: 'Cookies and storage used in this demo',
        list: [
          'ugrowsmm.demo.v1 — local storage entry holding your demo account, wallet, orders, transactions and API key.',
          'ugrowsmm.cookiePrefs.v1 — local storage entry remembering your cookie choices from this page.',
          'Strictly necessary session and security cookies will be introduced when real authentication is connected.',
          'This demo loads no advertising pixels, third-party analytics scripts or social media trackers.',
        ],
      },
      {
        id: 'third-party',
        title: 'Third-party services',
        paragraphs: [
          'A production deployment may use payment processors, hosting, email delivery and analytics providers, each of which may set its own cookies subject to its privacy policy. We would list those providers here before launch.',
        ],
      },
      {
        id: 'manage',
        title: 'Managing your preferences',
        paragraphs: [
          'Use the preference panel below to choose whether optional analytics and marketing storage may be used. Your choice is stored in this browser. You can also block or delete cookies and site data through your browser settings.',
          'Blocking strictly necessary cookies may prevent you from signing in or using parts of the panel.',
        ],
      },
      {
        id: 'dnt',
        title: 'Do Not Track and consent signals',
        paragraphs: [
          'Browsers may send “Do Not Track” or global privacy signals. Where required by applicable law, we honour legally recognised opt-out preference signals for optional tracking. This demo does not track you across sites.',
        ],
      },
      {
        id: 'updates',
        title: 'Updates and contact',
        paragraphs: [
          'We may update this policy when our use of cookies changes. The date at the top of the page shows the latest revision.',
          'Questions? Email privacy@ugrowsmm.com.',
        ],
      },
    ],
  },
}

export const LEGAL_ORDER: LegalSlug[] = ['terms', 'privacy', 'refund', 'cookies']
