# YouTube Module Target Language Integration

- [/] **Implementation Phase**
  - [ ] Modify [backend/internal/youtube/service.go](file:///home/edrio/Downloads/projetos/extension-proj/backend/internal/youtube/service.go) to accept `db DBTX` and update [GetTranscript(ctx, videoID)](file:///home/edrio/Downloads/projetos/extension-proj/backend/internal/youtube/service.go#32-70).
  - [ ] Add SQL query in [service.go](file:///home/edrio/Downloads/projetos/extension-proj/backend/internal/ai/service.go) to fetch the user's target language code (`i.codigo`) using `userID` from `ctx`.
  - [ ] Update [backend/internal/youtube/handler.go](file:///home/edrio/Downloads/projetos/extension-proj/backend/internal/youtube/handler.go) to extract `UserContext` and pass `ctx` to [GetTranscript](file:///home/edrio/Downloads/projetos/extension-proj/backend/internal/youtube/service.go#32-70).
  - [ ] Update [backend/cmd/api/main.go](file:///home/edrio/Downloads/projetos/extension-proj/backend/cmd/api/main.go) to inject `db` into `youtube.NewService(db)`.
  - [ ] Update [polyglot-flow/src/services/youtubeService.ts](file:///home/edrio/Downloads/projetos/extension-proj/polyglot-flow/src/services/youtubeService.ts) optionally sending `?lang=xx` if needed (the backend will gracefully fallback to the DB via JWT).

- [ ] **Verification Phase**
  - [ ] Compile the Go backend (`make run-back` equivalent).
  - [ ] Verify frontend TypeScript builds (`npx tsc --noEmit`).
  - [ ] Test the backend fallback logic via curl or frontend console.
