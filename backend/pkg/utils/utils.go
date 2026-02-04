package utils

import (
	"crypto/rand"
	"encoding/hex"
)

// GenerateID generates a random unique ID
func GenerateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// StringPtr returns a pointer to the given string
func StringPtr(s string) *string {
	return &s
}

// Contains checks if a slice contains a specific element
func Contains[T comparable](slice []T, element T) bool {
	for _, v := range slice {
		if v == element {
			return true
		}
	}
	return false
}
