package cache

import "time"

// TTLs padrão para diferentes recursos
const (
	DefaultTTL = 5 * time.Minute
	ShortTTL   = 1 * time.Minute
	LongTTL    = 15 * time.Minute
)
