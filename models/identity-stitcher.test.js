'use strict'

const {
  IdentityStitcher,
  UnknownUserError
} = require('./identity-stitcher')
const factory = require('../test/factory')
const chance = require('chance').Chance()
const User = require('./user')
const Event = require('./event')
const {sortBy, uniq, map} = require('lodash')

describe('IdentityStitcher', () => {
  let user
  beforeEach(() => {
    return factory.build('authenticated_web_user').then(webUser => { user = webUser })
  })

  it('is defined', () => {
    expect(IdentityStitcher).toBeDefined()
  })

  it('event without user identities should throw UnknownUserError', () => {
    return expect(IdentityStitcher(new Event())).rejects.toThrowError(UnknownUserError)
  })

  describe('has no matches', () => {
    it('should save the user', () => {
      jest.spyOn(User, 'fromEvent').mockImplementation(() => user)

      const event = new Event()
      return IdentityStitcher(event).then(identity => {
        expect(identity).toBeInstanceOf(User)
        expect(identity.id).toBeDefined()
        expect(event.user_id).toEqual(identity.id)
        expect(identity).toBe(user)
      })
    })
  })

  describe('has one match', () => {
    let other
    beforeEach(() => {
      return factory.create('web_user', {mcid: user.mcid, domain_userid: user.domain_userid})
        .then(webUser => { other = webUser })
    })

    it('should merge user', () => {
      jest.spyOn(User, 'fromEvent').mockImplementation(() => user)

      const event = new Event()
      return IdentityStitcher(event).then(identity => {
        expect(identity).toBeInstanceOf(User)
        expect(identity.id).toEqual(other.id)
        expect(event.user_id).toEqual(identity.id)
        expect(identity.network_userid).toEqual(expect.arrayContaining(user.network_userid))
        expect(identity.user_fingerprint).toEqual(expect.arrayContaining(user.user_fingerprint))
      })
    })
  })

  describe('has one false positive match', () => {
    let other
    beforeEach(() => {
      return factory.create('authenticated_web_user', {mcid: user.mcid}).then(webUser => { other = webUser })
    })

    it('should create new user and not merge', () => {
      jest.spyOn(User, 'fromEvent').mockImplementation(() => user)

      const event = new Event()
      return IdentityStitcher(event).then(identity => {
        expect(identity).toBeInstanceOf(User)
        expect(identity.id).not.toEqual(other.id)
        expect(event.user_id).toEqual(identity.id)
        expect(identity.gr_master_person_id).not.toEqual(expect.arrayContaining(other.gr_master_person_id))
      })
    })
  })

  describe('has multiple matches', () => {
    let others
    beforeEach(() => {
      return Promise.all([
        factory.create('web_user', {gr_master_person_id: user.gr_master_person_id}),
        factory.create('web_user', {mcid: user.mcid}),
        factory.create('web_user', {sso_guid: user.sso_guid})
      ]).then((users) => { others = users })
    })

    it('should merge users and return best match', () => {
      jest.spyOn(User, 'fromEvent').mockImplementation(() => user)

      const event = new Event()
      return IdentityStitcher(event).then(identity => {
        const mcids = uniq([].concat(user.mcid, others[0].mcid, others[1].mcid, others[2].mcid))
        const grids = uniq([].concat(user.gr_master_person_id, others[0].gr_master_person_id,
          others[1].gr_master_person_id, others[2].gr_master_person_id))
        expect(identity).toBeInstanceOf(User)
        expect(identity.id).toEqual(others[0].id)
        expect(event.user_id).toEqual(identity.id)
        expect(sortBy(identity.mcid)).toEqual(sortBy(mcids))
        expect(identity.gr_master_person_id).toEqual(expect.arrayContaining(grids))
      })
    })
  })

  describe('has multiple matches with false positives', () => {
    let others
    beforeEach(() => {
      return Promise.all([
        factory.create('web_user', {gr_master_person_id: user.gr_master_person_id}),
        factory.create('authenticated_web_user', {mcid: user.mcid}), // false positive
        factory.create('web_user', {sso_guid: user.sso_guid}),
        factory.create('web_user', {mcid: user.mcid, sso_guid: [chance.guid()]}) // false positive
      ]).then((users) => { others = users })
    })

    it('should merge users and return best match', () => {
      jest.spyOn(User, 'fromEvent').mockImplementation(() => user)

      const event = new Event()
      return IdentityStitcher(event).then(identity => {
        const mcids = uniq([].concat(user.mcid, others[0].mcid, others[2].mcid))
        expect(identity).toBeInstanceOf(User)
        expect(identity.id).toEqual(others[0].id)
        expect(event.user_id).toEqual(identity.id)
        expect(sortBy(identity.mcid)).toEqual(sortBy(mcids))
        expect(identity.gr_master_person_id).not.toEqual(expect.arrayContaining(others[1].gr_master_person_id))
      })
    })
  })

  describe('has multiple matches that are ambiguous', () => {
    let others
    beforeEach(() => {
      return Promise.all([
        factory.create('authenticated_web_user', {domain_userid: ['1234567890']}),
        factory.create('authenticated_web_user', {domain_userid: ['1234567890']})
      ]).then((users) => { others = users })
    })
    beforeEach(() => {
      return factory.build('web_user', {domain_userid: ['1234567890']}).then(webUser => { user = webUser })
    })

    it('should reject ambiguous and not merge', () => {
      jest.spyOn(User, 'fromEvent').mockImplementation(() => user)

      const event = new Event()
      return IdentityStitcher(event).then(identity => {
        const ids = map(others, 'id')
        expect(identity).toBe(user)
        expect(identity.id).toBeDefined()
        expect(event.user_id).toEqual(identity.id)
        expect(identity).toBe(user)
        expect(ids).not.toEqual(expect.arrayContaining([identity.id]))
      })
    })
  })
})
