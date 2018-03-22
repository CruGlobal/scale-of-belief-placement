'use strict'

const Score = require('./score')
const factory = require('../test/factory')

describe('Score', () => {
  it('should be defined', () => {
    expect(Score).toBeDefined()
  })

  describe('Score.toApiScore()', () => {
    it('should create a json object with a "score" sub-object', () => {
      const dbScore = {
        uri: 'http://somewhere.com',
        unaware: 2,
        curious: 3,
        follower: 1,
        guide: 2,
        confidence: 50
      }

      const expectedApiScore = {
        uri: dbScore.uri,
        score: {
          unaware: dbScore.unaware,
          curious: dbScore.curious,
          follower: dbScore.follower,
          guide: dbScore.guide,
          confidence: dbScore.confidence
        }
      }

      const apiScore = Score.toApiScore(dbScore)
      expect(apiScore).toBeDefined()
      expect(apiScore).toEqual(expectedApiScore)
    })
  })

  describe('Score.retrieve()', () => {
    let score
    beforeEach(() => {
      return factory.create('existing_score').then(existingScore => { score = existingScore })
    })

    afterEach(() => {
      return Score.destroy({truncate: true})
    })

    it('should return an existing score', done => {
      Score.retrieve(score.uri).then((result) => {
        expect(result).toBeDefined()
        expect(result.dataValues).toEqual(score.dataValues)
        done()
      })
    })

    it('should not return an existing score', done => {
      Score.retrieve('http://random.uri.com').then((result) => {
        expect(result).toBeNull()
        done()
      })
    })
  })

  describe('Score.save()', () => {
    let existingScore, createdScore, updatedScore
    beforeEach(() => {
      return Promise.all([
        factory.build('existing_score'),
        factory.build('created_score'),
        factory.create('updated_score')
      ]).then(scores => {
        existingScore = scores[0]
        createdScore = scores[1]
        updatedScore = scores[2]
      })
    })

    afterEach(() => {
      return Score.destroy({truncate: true})
    })

    it('should create a new score', done => {
      const inputScore = {
        unaware: createdScore.unaware,
        curious: createdScore.curious,
        follower: createdScore.follower,
        guide: createdScore.guide,
        confidence: createdScore.confidence
      }
      Score.save(createdScore.uri, inputScore).then((result) => {
        expect(result).toBeDefined()
        expect(result[0].dataValues.uri).toEqual(createdScore.dataValues.uri)
        expect(result[0].dataValues.unaware).toEqual(createdScore.dataValues.unaware)
        expect(result[0].dataValues.curious).toEqual(createdScore.dataValues.curious)
        expect(result[0].dataValues.follower).toEqual(createdScore.dataValues.follower)
        expect(result[0].dataValues.guide).toEqual(createdScore.dataValues.guide)
        expect(result[0].dataValues.confidence).toEqual(createdScore.dataValues.confidence)
        done()
      })
    })

    it('should update an existing score', done => {
      const inputScore = {
        unaware: updatedScore.unaware,
        curious: updatedScore.curious,
        follower: updatedScore.follower,
        guide: updatedScore.guide,
        confidence: updatedScore.confidence
      }
      Score.save(existingScore.uri, inputScore).then((result) => {
        expect(result).toBeDefined()
        expect(result[0].dataValues.uri).toEqual(existingScore.dataValues.uri)

        expect(result[0].dataValues.unaware).toEqual(updatedScore.dataValues.unaware)
        expect(result[0].dataValues.unaware).not.toEqual(existingScore.dataValues.unaware)

        expect(result[0].dataValues.curious).toEqual(updatedScore.dataValues.curious)
        expect(result[0].dataValues.curious).not.toEqual(existingScore.dataValues.curious)

        expect(result[0].dataValues.follower).toEqual(updatedScore.dataValues.follower)
        expect(result[0].dataValues.follower).not.toEqual(existingScore.dataValues.follower)

        expect(result[0].dataValues.guide).toEqual(updatedScore.dataValues.guide)
        expect(result[0].dataValues.guide).not.toEqual(existingScore.dataValues.guide)

        expect(result[0].dataValues.confidence).toEqual(updatedScore.dataValues.confidence)
        expect(result[0].dataValues.confidence).not.toEqual(existingScore.dataValues.confidence)
        done()
      })
    })
  })
})
