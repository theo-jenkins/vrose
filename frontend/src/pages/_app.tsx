import { AppProps } from 'next/app';
import '../styles/globals.css'; // Import global styles
import '../styles/index.css'; // Import index styles
import { Provider } from 'react-redux';
import store from '../../redux/store';
import PreloadRedux from '../../redux/utils/preloadRedux';

const MyApp = ({ Component, pageProps }: AppProps) => {
    return (
        <Provider store={store}>
            <PreloadRedux /> {/* Preload Redux state and passes it to _app.js */}
            <Component {...pageProps} />
        </Provider>
    );
};

export default MyApp;
