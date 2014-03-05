define([], function() {


    describe('isWindow', function() {

        it('be', function() {
            expect(avalon.isWindow(1)).to.be(false)
            expect(avalon.isWindow({})).to.be(false)
            var obj = {
            }
            obj.window = obj
            expect(avalon.isWindow(obj)).to.be(false)
            expect(avalon.isWindow(window)).to.be(true)
        })

    })


})
