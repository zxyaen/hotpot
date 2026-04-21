# ---- 构建阶段 ----
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- 运行阶段 ----
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# 从构建阶段拷贝编译产物和静态数据
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

# CloudBase 云托管通过环境变量 PORT 注入端口，默认 3000
EXPOSE 3000

CMD ["node", "dist/app.js"]
