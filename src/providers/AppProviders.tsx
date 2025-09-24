import { ChakraProvider } from '@chakra-ui/react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { store } from '../../redux/store';
import { ThemeProvider } from '../../src/contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';

type AppProvidersProps = {
  children: React.ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ChakraProvider>
      <Provider store={store}>
        <ThemeProvider>
          <AuthProvider>
            <Router>
              {children}
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </Provider>
    </ChakraProvider>
  );
};
