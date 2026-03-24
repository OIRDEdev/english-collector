run-all:
	cd backend && go run cmd/api/main.go
	cd polyglot-flow && npm run dev

run-back:
	cd backend && go run cmd/api/main.go

run-front:
	cd polyglot-flow && npm run dev

test:
	cd backend && go test -json ./testes/... > ./testes/resultados/resultados.json

test-v:
	cd backend && go test -v ./testes/...