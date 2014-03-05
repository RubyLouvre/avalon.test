define([],function() {


    describe('Assertion', function() {

        it('be', function() {
            expect(1).to.be(1)
            expect('1').not.to.be(1)
            expect(NaN).not.to.be(NaN)
        })

        it('eql', function() {
            expect('1').to.eql(1)
            expect(1).to.eql(true)
            expect({
                a : 'b'
            }).to.eql({
                a : 'b'
            })
        })

        it('ok', function() {
            expect(1).to.be.ok()
            expect({}).to.be.ok()
            expect(0).not.to.be.ok()
        })

        it('a / an', function() {
            expect(5).to.be.a('number')
            expect([]).to.be.an('array')
        })

        it('match', function() {
            expect('0.1.0').to.match(/[0-9]+\.[0-9]+\.[0-9]+/)
        })
    })

  
})
