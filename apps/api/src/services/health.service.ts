export const getHealthStatus = () => {
  return {
    success: true,
    message: "Distributed Task Processing API is running 🚀",
    timestamp: new Date().toISOString(),
  };
};