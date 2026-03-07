package anki_test

import (
	"testing"
	"time"

	"extension-backend/internal/anki"
)

func TestCalculateSM2_Failures(t *testing.T) {
	// Grade 1: Total blackout, reset everything.
	res := anki.CalculateSM2(2.5, 10, 5, 5, 1)

	if res.NovaFacilidade >= 2.5 {
		t.Errorf("expected facilidade to drop below 2.5 on grade 1, got %f", res.NovaFacilidade)
	}
	if res.NovoIntervalo != 1 { // Assuming minimum penalty assigns interval=1
		t.Errorf("expected intervalo to be 1, got %d", res.NovoIntervalo)
	}
	if res.NovasRepeticoes != 0 {
		t.Errorf("expected repeticoes to reset to 0, got %d", res.NovasRepeticoes)
	}
	if res.NovaSequencia != 0 {
		t.Errorf("expected sequencia to reset to 0, got %d", res.NovaSequencia)
	}
	if res.NovoEstado != "aprendizado" {
		t.Errorf("expected state to switch to aprendizado, got %s", res.NovoEstado)
	}
}

func TestCalculateSM2_Hard(t *testing.T) {
	// Grade 3: Hard but remembered
	res := anki.CalculateSM2(2.5, 10, 2, 2, 3)

	if res.NovaFacilidade >= 2.5 {
		t.Errorf("expected facilidade to drop slightly below 2.5 on grade 3, got %f", res.NovaFacilidade)
	}
	if res.NovasRepeticoes != 3 {
		t.Errorf("expected repeticoes to increment to 3, got %d", res.NovasRepeticoes)
	}
	if res.NovaSequencia != 3 {
		t.Errorf("expected sequencia to increment to 3, got %d", res.NovaSequencia)
	}

	// We expect interval to maintain its previous growth since it's repetition > 2
	expectedInterval := 25 // 10 * 2.5 = 25
	if res.NovoIntervalo != expectedInterval {
		t.Errorf("interval seems incorrect, got %d, expected %d", res.NovoIntervalo, expectedInterval)
	}
}

func TestCalculateSM2_Easy(t *testing.T) {
	// Grade 4: Easy
	res := anki.CalculateSM2(2.5, 6, 2, 2, 4)

	// Grade 4 EF equation modifier: EF' = EF + 0.1 - (5-4) * (0.08 + (5-4)*0.02) = EF + 0.1 - 0.1 = EF.
	// Actually based on the formula: novaFacilidade += 0.1 - (5.0-4.0)*(0.08+(5.0-4.0)*0.02)
	// 5-4 = 1.0.  0.08 + 1.0 * 0.02 = 0.10.   1.0 * 0.10 = 0.10.
	// 0.10 - 0.10 = 0.00. So EF remains exactly 2.50.
	if res.NovaFacilidade != 2.5 {
		t.Errorf("expected facilidade to remain equal on grade 4, got %f", res.NovaFacilidade)
	}
	if res.NovasRepeticoes != 3 {
		t.Errorf("expected incremented repeticoes")
	}

	expectedInterval := int(float64(6) * res.NovaFacilidade)
	if res.NovoIntervalo != expectedInterval {
		t.Errorf("expected interval to grow via EF %d, got %d", expectedInterval, res.NovoIntervalo)
	}
	if res.NovoEstado != "revisao" {
		t.Errorf("expected estado revisao, got %s", res.NovoEstado)
	}

	// Make sure next review spans the interval accurately
	expectedNextReview := time.Now().AddDate(0, 0, expectedInterval).Format("2006-01-02")
	gotNextReview := res.ProximaRevisao.Format("2006-01-02")
	if expectedNextReview != gotNextReview {
		t.Errorf("proxima_revisao off, got %s, expected %s", gotNextReview, expectedNextReview)
	}
}
