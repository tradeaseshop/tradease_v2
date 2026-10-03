# TradeEase Google Play readiness

Code-derived preparation worksheet. Final Play Console declarations must be confirmed against the exact Android build and enabled production services.

| Data | Collected | Shared with | Purpose |
|---|---|---|---|
| Name/email/phone | Yes | Google, Paystack, Resend, vendors/logistics where needed | Account, authentication, payment, communications, fulfilment |
| Delivery address | When an order requires it | Selected vendor/logistics provider | Fulfilment |
| Orders/transactions | Yes | Paystack, vendors/logistics where needed | Payment, fulfilment, support |
| Profile/store image | Optional | Public marketplace surfaces if chosen | Identity/store display |
| KYC/vendor verification data | When submitted | TradeEase/admin verification workflow | Compliance |
| Support messages | When used | Configured service providers as needed | Support |
| AI prompt content | Only when AI features are used | Google Gemini | Recommendations, chat, listing optimisation, admin insights |
| Technical/request data | Server-side | Hosting/infrastructure | Security and operation |

Production controls: `ALLOW_DEMO_SEED=false`, `ALLOW_DEMO_WALLET=false`, `DEMO_MARKETPLACE_SEED=false`; production test mode is forced off; fake Facebook/Apple sign-in was removed.

Android API 36: the web source does not include the Android Gradle wrapper. The separate Android wrapper/AAB must be regenerated with `targetSdk >= 36` for a submission under the current requirement.
