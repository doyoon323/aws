#node.js 이미지 다운 
FROM node:18


WORKDIR /app

#node.js 패키지 목록과 버전 정보가 담겨저 있음
COPY package*.json ./



#의존성 설치  (copy한 package 기준으로 필요한 라이브러리 등을 저장)
RUN npm install 

#소스 복사  (서버 코드 등)
COPY . .

#포트 노출 (컨테이너 내부에서 사용하는 포트 )
EXPOSE 3000

#서버 실행 (node server.js 처럼, 실행 명령어)
CMD ["node", "server.js"]