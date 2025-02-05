const path = require("path");

module.exports = {
  entry: "./frontend/src/index.js", // Update to reflect the new relative path
  output: {
    path: path.resolve(__dirname, "static"), // Output path remains in the static folder
    filename: "bundle.js", // Name of the bundled file
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/, // Matches .js and .jsx files
        exclude: /node_modules/,
        use: "babel-loader", // Use Babel loader
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"], // Load CSS files
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx"], // Allows importing without specifying extensions
  },
  devServer: {
    contentBase: path.join(__dirname, "frontend"), // Serve files from the frontend folder
    port: 8080, // Dev server port
  },
};
