import "./assets/styles/App.css";
import AppRoute from "./router/AppRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";

const Router = () => {
  return (
    <ErrorBoundary>
      <AppRoute />
    </ErrorBoundary>
  );
};

export default Router;
