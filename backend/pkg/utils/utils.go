package utils

import (
	"crypto/rand"
	"encoding/hex"
)


func GenerateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}


func StringPtr(s string) *string {
	return &s
}


func Contains[T comparable](slice []T, element T) bool {
	for _, v := range slice {
		if v == element {
			return true
		}
	}
	return false
}
