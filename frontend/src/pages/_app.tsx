import { AppProps } from 'next/app';
import '../styles/globals.css'; // Import global styles

const MyApp = ({ Component, pageProps }: AppProps) => {
    return <Component {...pageProps} />;
};

export default MyApp;
