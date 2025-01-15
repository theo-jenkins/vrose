import { AppProps } from 'next/app';
import '../styles/globals.css'; // Import global styles
import '../styles/index.css'; // Import index styles

const MyApp = ({ Component, pageProps }: AppProps) => {
    return <Component {...pageProps} />;
};

export default MyApp;
