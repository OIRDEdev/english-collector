package domain

type TranslationSegment struct {
	Start       float64           `json:"start"`
	Dur         float64           `json:"dur"`
	TextEn      string            `json:"text_en"`
	TextPt      string            `json:"text_pt"`
	Explanation string            `json:"explanation"`
	Mapping     map[string]string `json:"mapping"`
}

type TranscriptResponse struct {
	VideoID  string               `json:"video_id"`
	Language string               `json:"language"`
	Segments []TranslationSegment `json:"segments"`
}
