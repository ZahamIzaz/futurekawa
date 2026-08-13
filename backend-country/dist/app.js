"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const measurements_1 = __importDefault(require("./routes/measurements"));
const lots_1 = __importDefault(require("./routes/lots"));
const alerts_1 = __importDefault(require("./routes/alerts"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/measurements', measurements_1.default);
app.use('/api/lots', lots_1.default);
app.use('/api/alerts', alerts_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'backend-country' });
});
exports.default = app;
