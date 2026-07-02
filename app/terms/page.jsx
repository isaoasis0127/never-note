import Link from "next/link";
import GiraffeLogo from "@/components/GiraffeLogo";
import { termsSections, termsEffectiveDate, termsOperatorName, termsContact } from "./content";

export const metadata = {
  title: "利用規約",
  description: "Never Note の利用規約です。",
};

export default function TermsPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "48px 20px 80px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 720 }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "#8a5a3c",
            textDecoration: "none",
            marginBottom: 32,
          }}
        >
          <GiraffeLogo size={18} color="var(--dark-brown)" />
          Never Note に戻る
        </Link>

        <h1 style={{ fontSize: 32, marginBottom: 4, color: "var(--dark-brown)" }}>利用規約</h1>
        <p style={{ fontSize: 13, color: "#a89685", marginTop: 0, marginBottom: 40 }}>制定日: {termsEffectiveDate}</p>

        <p style={{ fontSize: 14, lineHeight: 1.9, color: "#4a3a2c", marginBottom: 40 }}>
          本利用規約（以下「本規約」といいます）は、{termsOperatorName}（以下「当方」といいます）が提供する共同ノートサービス「Never
          Note」（以下「本サービス」といいます）の利用条件を定めるものです。本サービスをご利用になる方（以下「利用者」といいます）には、本規約に同意した上で本サービスをご利用いただきます。
        </p>

        {termsSections.map((section) => (
          <section key={section.heading} style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontSize: 18,
                color: "var(--dark-brown)",
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: "1px solid rgba(44,24,16,0.1)",
              }}
            >
              {section.heading}
            </h2>
            {section.body.map((paragraph, i) => (
              <p key={i} style={{ fontSize: 14, lineHeight: 1.9, color: "#4a3a2c", margin: "0 0 10px" }}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(44,24,16,0.1)" }}>
          <p style={{ fontSize: 13, color: "#a89685", lineHeight: 1.8 }}>
            本規約に関するお問い合わせ: {termsContact}
          </p>
        </section>
      </div>
    </main>
  );
}
