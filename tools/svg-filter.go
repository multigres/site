package main

import (
	"flag"
	"fmt"
	"image/color"
	"log"
	"os"
	"regexp"
	"strconv"
	"strings"

	"golang.org/x/image/colornames"
)

// ColorTransform applies invert(93%) and hue-rotate(180deg) transformation
func ColorTransform(c color.Color) color.Color {
	r, g, b, a := c.RGBA()
	// Convert from 16-bit to 8-bit
	r8 := uint8(r >> 8)
	g8 := uint8(g >> 8)
	b8 := uint8(b >> 8)
	a8 := uint8(a >> 8)

	// Apply invert(93%)
	inverted := invertColor(r8, g8, b8, 0.93)

	// Apply hue-rotate(180deg)
	rotated := hueRotate(inverted[0], inverted[1], inverted[2], 180)

	return color.RGBA{R: rotated[0], G: rotated[1], B: rotated[2], A: a8}
}

// invertColor inverts RGB values by the given intensity (0-1)
func invertColor(r, g, b uint8, intensity float64) [3]uint8 {
	return [3]uint8{
		uint8(float64(r)*(1-intensity) + float64(255-r)*intensity),
		uint8(float64(g)*(1-intensity) + float64(255-g)*intensity),
		uint8(float64(b)*(1-intensity) + float64(255-b)*intensity),
	}
}

// hueRotate rotates the hue of RGB values by degrees (0-360)
func hueRotate(r, g, b uint8, degrees float64) [3]uint8 {
	// Normalize to 0-1
	rf := float64(r) / 255.0
	gf := float64(g) / 255.0
	bf := float64(b) / 255.0

	// Convert RGB to HSL
	max := maxFloat(rf, gf, bf)
	min := minFloat(rf, gf, bf)
	l := (max + min) / 2.0

	var h, s float64
	if max == min {
		h = 0
		s = 0
	} else {
		if l < 0.5 {
			s = (max - min) / (max + min)
		} else {
			s = (max - min) / (2.0 - max - min)
		}

		switch max {
		case rf:
			h = ((gf - bf) / (max - min)) + 0
			if gf < bf {
				h += 6
			}
		case gf:
			h = ((bf - rf) / (max - min)) + 2
		case bf:
			h = ((rf - gf) / (max - min)) + 4
		}
		h /= 6.0
	}

	// Rotate hue
	h += degrees / 360.0
	if h < 0 {
		h += 1
	}
	if h > 1 {
		h -= 1
	}

	// Convert HSL back to RGB
	var r2, g2, b2 float64
	if s == 0 {
		r2 = l
		g2 = l
		b2 = l
	} else {
		var q, p float64
		if l < 0.5 {
			q = l * (1 + s)
		} else {
			q = l + s - l*s
		}
		p = 2*l - q

		r2 = hueToRGB(p, q, h+1.0/3.0)
		g2 = hueToRGB(p, q, h)
		b2 = hueToRGB(p, q, h-1.0/3.0)
	}

	return [3]uint8{
		uint8(r2 * 255),
		uint8(g2 * 255),
		uint8(b2 * 255),
	}
}

func hueToRGB(p, q, t float64) float64 {
	if t < 0 {
		t += 1
	}
	if t > 1 {
		t -= 1
	}
	if t < 1.0/6.0 {
		return p + (q-p)*6.0*t
	}
	if t < 1.0/2.0 {
		return q
	}
	if t < 2.0/3.0 {
		return p + (q-p)*(2.0/3.0-t)*6.0
	}
	return p
}

func maxFloat(a, b, c float64) float64 {
	if a > b && a > c {
		return a
	}
	if b > c {
		return b
	}
	return c
}

func minFloat(a, b, c float64) float64 {
	if a < b && a < c {
		return a
	}
	if b < c {
		return b
	}
	return c
}

// parseColor converts a color string to a color.Color
func parseColor(colorStr string) (color.Color, error) {
	colorStr = strings.TrimSpace(colorStr)

	// Try named colors first
	if c, ok := colornames.Map[colorStr]; ok {
		return c, nil
	}

	// Handle hex colors
	if strings.HasPrefix(colorStr, "#") {
		hex := colorStr[1:]
		if len(hex) == 6 {
			r, _ := strconv.ParseInt(hex[0:2], 16, 64)
			g, _ := strconv.ParseInt(hex[2:4], 16, 64)
			b, _ := strconv.ParseInt(hex[4:6], 16, 64)
			return color.RGBA{R: uint8(r), G: uint8(g), B: uint8(b), A: 255}, nil
		} else if len(hex) == 8 {
			r, _ := strconv.ParseInt(hex[0:2], 16, 64)
			g, _ := strconv.ParseInt(hex[2:4], 16, 64)
			b, _ := strconv.ParseInt(hex[4:6], 16, 64)
			a, _ := strconv.ParseInt(hex[6:8], 16, 64)
			return color.RGBA{R: uint8(r), G: uint8(g), B: uint8(b), A: uint8(a)}, nil
		}
	}

	// Handle rgb() colors
	if strings.HasPrefix(colorStr, "rgb") {
		re := regexp.MustCompile(`rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)`)
		matches := re.FindStringSubmatch(colorStr)
		if len(matches) == 4 {
			r, _ := strconv.Atoi(matches[1])
			g, _ := strconv.Atoi(matches[2])
			b, _ := strconv.Atoi(matches[3])
			return color.RGBA{R: uint8(r), G: uint8(g), B: uint8(b), A: 255}, nil
		}
	}

	return color.RGBA{R: 0, G: 0, B: 0, A: 255}, fmt.Errorf("unsupported color format: %s", colorStr)
}

// colorToHex converts a color back to hex string
func colorToHex(c color.Color) string {
	r, g, b, a := c.RGBA()
	r8 := uint8(r >> 8)
	g8 := uint8(g >> 8)
	b8 := uint8(b >> 8)
	a8 := uint8(a >> 8)

	if a8 == 255 {
		return fmt.Sprintf("#%02x%02x%02x", r8, g8, b8)
	}
	return fmt.Sprintf("#%02x%02x%02x%02x", r8, g8, b8, a8)
}

// transformSVG applies the color transformation to fill and stroke attributes
func transformSVG(content string) string {
	// Pattern to match fill="..." or stroke="..."
	attrPattern := regexp.MustCompile(`(fill|stroke)\s*=\s*"([^"]*)"`)

	result := attrPattern.ReplaceAllStringFunc(content, func(match string) string {
		parts := attrPattern.FindStringSubmatch(match)
		attrName := parts[1]
		attrValue := parts[2]

		// Skip if it's a URL reference or 'none'
		if strings.HasPrefix(attrValue, "url(") || attrValue == "none" {
			return match
		}

		// Parse and transform the color
		c, err := parseColor(attrValue)
		if err != nil {
			return match
		}

		transformed := ColorTransform(c)
		newValue := colorToHex(transformed)

		return fmt.Sprintf(`%s="%s"`, attrName, newValue)
	})

	return result
}

func main() {
	inputFile := flag.String("input", "", "Input SVG file")
	outputFile := flag.String("output", "", "Output SVG file (default: stdout)")
	flag.Parse()

	if *inputFile == "" {
		log.Fatal("Please provide an input file with -input flag")
	}

	// Read the SVG file
	content, err := os.ReadFile(*inputFile)
	if err != nil {
		log.Fatalf("Failed to read input file: %v", err)
	}

	// Transform the SVG
	transformed := transformSVG(string(content))

	// Write output
	if *outputFile == "" {
		fmt.Print(transformed)
	} else {
		err := os.WriteFile(*outputFile, []byte(transformed), 0644)
		if err != nil {
			log.Fatalf("Failed to write output file: %v", err)
		}
		fmt.Printf("Transformed SVG written to %s\n", *outputFile)
	}
}
