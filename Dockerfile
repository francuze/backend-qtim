FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# Удаляем существующую папку node_modules, если такая есть
RUN rm -rf node_modules

# Копируем оставшийся код
COPY . .

# Снова устанавливаем зависимости
RUN npm install 

RUN npm uninstall bcrypt

RUN npm i bcrypt

EXPOSE 3000

CMD ["npm", "run", "start"]
