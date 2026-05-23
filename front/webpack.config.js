import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import webpack from "webpack";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export default {
  entry: "./src/main.tsx",
  output: {
    filename: "bundle.js",
    path: path.resolve("dist"),
    clean: true,
    publicPath: "/",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "public/index.html",
    }),
    new webpack.DefinePlugin({
      "process.env.BACKEND_URL": JSON.stringify(BACKEND_URL),
    }),
  ],
  devServer: {
    static: {
      directory: path.join(process.cwd(), "public"),
    },
    compress: true,
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: "all",
    hot: true,
    historyApiFallback: true,
  },
};
