import {
    Body,
    Button,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Tailwind,
    type TailwindConfig,
    Text,
} from "react-email";

const tailwindConfig: TailwindConfig = {
    theme: {
        extend: {
            colors: {
                brand: "#5F51E8",
                muted: "#8898aa",
                divider: "#cccccc",
            },
            fontFamily: {
                koala: ["HelveticaNeue", "Helvetica", "Arial", "sans-serif"],
            },
            lineHeight: {
                "6.5": "26px",
            },
        },
    },
};

interface KoalaWelcomeEmailProps {
    userFirstname: string;
}

export const KoalaWelcomeEmail = ({
    userFirstname,
}: KoalaWelcomeEmailProps) => (
    <Html>
        <Head />
        <Tailwind config={tailwindConfig}>
            <Body className="bg-white font-koala">
                <Preview>
                    The sales intelligence platform that helps you uncover
                    qualified leads.
                </Preview>
                <Container className="mx-auto py-5 pb-12">
                    <Img
                        src="https://react-email-demo-6woqf4gn1-resend.vercel.app/static/koala-logo.png"
                        width="170"
                        height="50"
                        alt="Koala"
                        className="mx-auto"
                    />
                    <Text className="text-[16px] leading-6.5">
                        Hi {userFirstname},
                    </Text>
                    <Text className="text-[16px] leading-6.5">
                        Welcome to Koala, the sales intelligence platform that
                        helps you uncover qualified leads and close deals
                        faster.
                    </Text>
                    <Section className="text-center">
                        <Button
                            className="bg-brand rounded-[3px] text-white text-[16px] no-underline text-center block p-3"
                            href="https://getkoala.com"
                        >
                            Get started
                        </Button>
                    </Section>
                    <Text className="text-[16px] leading-6.5">
                        Best,
                        <br />
                        The Koala team
                    </Text>
                    <Hr className="border-divider my-5" />
                    <Text className="text-muted text-[12px]">
                        470 Noor Ave STE B #1148, South San Francisco, CA 94080
                    </Text>
                </Container>
            </Body>
        </Tailwind>
    </Html>
);

KoalaWelcomeEmail.PreviewProps = {
    userFirstname: "Alan",
} as KoalaWelcomeEmailProps;

export default KoalaWelcomeEmail;
