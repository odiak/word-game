import React, { FC, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

function hash(str: string): number {
  let n = 12345
  for (const c of str) {
    const cc = c.charCodeAt(0)
    n = (n << 4) ^ cc
  }
  return n
}

function useWordIndex(n: number): number {
  const [i, setI] = useState(() => hash(location.hash))
  useEffect(() => {
    addEventListener('hashchange', () => {
      setI(hash(location.hash))
    })
  }, [])
  return Math.abs(i) % n
}

function random() {
  let s = ''
  for (let i = 0; i < 6; i++) {
    s += Math.floor(Math.random() * 16).toString(16)
  }
  location.hash = s
}

type Guess = Array<{ char: string; type: 'noop' | 'position-different' | 'exact' }>

export const App: FC = () => {
  const [words, setWords] = useState([] as string[])

  useEffect(() => {
    ;(async () => {
      const res = await fetch(
        'https://raw.githubusercontent.com/charlesreid1/five-letter-words/master/sgb-words.txt'
      )
      const raw = await res.text()
      const words = raw.split('\n').filter((w) => w.length === 5)
      setWords(words)
    })()
  }, [])

  const index = useWordIndex(words.length)
  const word = words[index]

  useEffect(() => {
    if (location.hash === '') {
      random()
    }
  }, [index])

  const [wordInput, setWordInput] = useState('')
  const [guesses, setGuesses] = useState([] as Array<Guess>)

  useEffect(() => {
    setGuesses([])
    setWordInput('')
  }, [index])

  const usableChars = useMemo(() => {
    const chars = new Set('abcdefghijklmnopqrstuvwxyz')
    for (const g of guesses) {
      for (const { char, type } of g) {
        if (type === 'noop') chars.delete(char)
      }
    }
    return chars
  }, [guesses])

  if (words.length === 0) return <p>loading</p>

  return (
    <Container>
      <h1>Word Game</h1>
      <Button onClick={() => random()}>random</Button>
      <span>seed: {location.hash}</span>
      {guesses.length < 6 && !guesses[guesses.length - 1]?.every(({ type }) => type === 'exact') ? (
        <>
          <Input
            value={wordInput}
            maxLength={5}
            onChange={(e) => setWordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && wordInput.length === 5 && words.includes(wordInput)) {
                const g: Guess = []
                for (let i = 0; i < 5; i++) {
                  let type: Guess[number]['type']
                  const char = wordInput.charAt(i)
                  if (word.charAt(i) === char) {
                    type = 'exact'
                  } else if (word.indexOf(char) !== -1) {
                    type = 'position-different'
                  } else {
                    type = 'noop'
                  }
                  g.push({ char, type })
                }
                setGuesses((gs) => [...gs, g])
                setWordInput('')
              }
            }}
          />
          {wordInput.length === 5 && !words.includes(wordInput) && <div>not in word list</div>}
          <div>usable chars: {[...usableChars].join(' ')}</div>
        </>
      ) : (
        <div>
          <Button
            onClick={() => {
              const e = document.createElement('textarea')
              e.value = guesses
                .map((g) =>
                  g
                    .map(({ type }) => (type === 'noop' ? '⬜' : type === 'exact' ? '🟩' : '🟨'))
                    .join('')
                )
                .join('\n')
              document.body.appendChild(e)
              e.select()
              document.execCommand('copy')
              document.body.removeChild(e)
            }}
          >
            copy result
          </Button>
        </div>
      )}
      {guesses.map((g, i) => (
        <GuessWord key={i}>
          {g.map(({ char, type }, j) => (
            <GuessChar key={j} type={type}>
              <Char>{char}</Char>
            </GuessChar>
          ))}
        </GuessWord>
      ))}
    </Container>
  )
}

const Container = styled.div`
  font-family: monospace;
  font-size: 16px;
`

const Input = styled.input`
  display: block;
  font-family: monospace;
  font-size: 20px;
`

const GuessWord = styled.div`
  display: flex;
  margin-top: 10px;
`

const GuessChar = styled.div<{ type: 'noop' | 'position-different' | 'exact' }>`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ type }) =>
    type === 'noop' ? '#ccc' : type === 'exact' ? '#2fa32b' : '#f0e161'};
`

const Char = styled.div`
  width: fit-content;
  height: fit-content;
  font-size: 22px;
`

const Button = styled.button`
  margin-top: 10px;
  margin-bottom: 10px;
  margin-right: 10px;
`
