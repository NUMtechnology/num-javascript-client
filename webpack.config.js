path = require('path')

module.exports = {
    mode: "production",
    entry: "./lib/Interpreter.modl-interpreter",
    output: {
        path: path.join(__dirname, '/dist'),
        filename: "bundle.js"
    },
    resolve: {
        extensions: [".tsx", ".modl-interpreter", ".js", ".json"]
    },
    target: "node",
    module: {
        rules: [
            // all files with a '.modl-interpreter' or '.tsx' extension will be handled by 'modl-interpreter-loader'
            {test: /\.tsx?$/, use: ["modl-interpreter-loader"], exclude: [/node_modules/, /test/]}
        ]
    }
}
