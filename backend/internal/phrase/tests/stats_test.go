package tests

import (
	"fmt"
	"os"
	"testing"
	"time"
)

// TestMain roda antes de todos os testes e gera estatísticas
func TestMain(m *testing.M) {
	fmt.Println("╔══════════════════════════════════════════════╗")
	fmt.Println("║   Phrase Repository - Unit Tests             ║")
	fmt.Println("╚══════════════════════════════════════════════╝")
	fmt.Println()

	start := time.Now()
	code := m.Run()
	elapsed := time.Since(start)

	fmt.Println()
	fmt.Println("══════════════════════════════════════════════")
	fmt.Printf("  ⏱  Tempo total: %s\n", elapsed.Round(time.Millisecond))
	if code == 0 {
		fmt.Println("  ✅ Todos os testes passaram!")
	} else {
		fmt.Println("  ❌ Alguns testes falharam")
	}
	fmt.Println("══════════════════════════════════════════════")

	os.Exit(code)
}
