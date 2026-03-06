run-all:
	cd backend && go run cmd/api/main.go
	cd polyglot-flow && npm run dev

run-back:
	cd backend && go run cmd/api/main.go

run-front:
	cd polyglot-flow && npm run dev